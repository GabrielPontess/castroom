using Castroom.Data;
using Livekit.Server.Sdk.Dotnet;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using RoomEntity = Castroom.Models.Room;
using ParticipantEntity = Castroom.Models.Participant;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Server=localhost,1433;Database=CastroomDb;User Id=sa;Password=Castroom_password_123;TrustServerCertificate=True;Encrypt=False";

builder.Services.AddDbContext<CastroomDbContext>(options => options.UseSqlServer(connectionString));

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
        policy.WithOrigins("http://localhost:3000")
            .AllowAnyHeader()
            .AllowAnyMethod());
});

var app = builder.Build();

await EnsureDatabaseReadyAsync(app.Services);

app.UseCors("Frontend");

app.UseSwagger(options =>
{
    options.RouteTemplate = "openapi/{documentName}.json";
});

app.MapScalarApiReference(options =>
{
    options.Title = "Castroom API";
    options.Theme = ScalarTheme.Mars;
    options.OpenApiRoutePattern = "/openapi/{documentName}.json";
});

var apiKey = builder.Configuration["LIVEKIT_API_KEY"] ?? "devkey";
var apiSecret = builder.Configuration["LIVEKIT_API_SECRET"] ?? "dev_secret_super_segura_1234567890";

app.MapGet("/health", () => Results.Ok(new { status = "ok" }))
    .WithName("HealthCheck")
    .WithSummary("Verifica se a API esta disponivel.")
    .WithDescription("Endpoint simples de health check para o ambiente local.");

app.MapGet("/api/rooms/active", async (CastroomDbContext dbContext) =>
{
    var activeRooms = await dbContext.Rooms
        .Where(room => room.IsActive)
        .OrderByDescending(room => room.StartedAt)
        .Select(room => new ActiveRoomResponse(
            room.Name,
            room.StartedAt,
            room.Participants.Count(participant => participant.IsConnected),
            room.Participants.Count(participant => participant.IsConnected && participant.Role == "teacher")
        ))
        .ToListAsync();

    return Results.Ok(activeRooms);
})
    .WithName("GetActiveRooms")
    .WithSummary("Lista as aulas atualmente em andamento.")
    .WithDescription("Retorna as salas marcadas como ativas no banco local.")
    .Produces<List<ActiveRoomResponse>>();

app.MapPost("/api/tokens", async (TokenRequest request, CastroomDbContext dbContext) =>
{
    if (string.IsNullOrWhiteSpace(request.RoomName) || string.IsNullOrWhiteSpace(request.ParticipantName))
    {
        return Results.BadRequest(new ErrorResponse("RoomName e ParticipantName sao obrigatorios."));
    }

    var roomName = request.RoomName.Trim();
    var participantName = request.ParticipantName.Trim();
    var normalizedRoomName = NormalizeValue(roomName);
    var normalizedParticipantName = NormalizeValue(participantName);
    var participantRole = request.IsTeacher ? "teacher" : "student";

    var room = await dbContext.Rooms
        .SingleOrDefaultAsync(existingRoom => existingRoom.NormalizedName == normalizedRoomName);

    if (room is null)
    {
        room = new RoomEntity
        {
            Name = roomName,
            NormalizedName = normalizedRoomName,
            Status = "active",
            CreatedAt = DateTimeOffset.UtcNow,
            StartedAt = DateTimeOffset.UtcNow,
            CreatedByName = participantName,
            IsActive = true,
        };

        dbContext.Rooms.Add(room);
    }
    else
    {
        room.IsActive = true;
        room.Status = "active";
        room.EndedAt = null;
    }

    var participantAlreadyConnected = await dbContext.Participants.AnyAsync(participant =>
        participant.RoomId == room.Id
        && participant.NormalizedDisplayName == normalizedParticipantName
        && participant.IsConnected);

    if (participantAlreadyConnected)
    {
        return Results.Conflict(new ErrorResponse("Ja existe um participante conectado com esse nome nesta sala."));
    }

    dbContext.Participants.Add(new ParticipantEntity
    {
        Room = room,
        DisplayName = participantName,
        NormalizedDisplayName = normalizedParticipantName,
        Role = participantRole,
        JoinedAt = DateTimeOffset.UtcNow,
        IsConnected = true,
    });

    await dbContext.SaveChangesAsync();

    var token = new AccessToken(apiKey, apiSecret)
        .WithIdentity(participantName)
        .WithName(participantName)
        .WithAttributes(new Dictionary<string, string>
        {
            ["role"] = participantRole,
        })
        .WithTtl(TimeSpan.FromHours(2))
        .WithGrants(new VideoGrants
        {
            RoomJoin = true,
            Room = roomName,
            CanPublish = true,
            CanSubscribe = true,
            CanPublishData = true,
            RoomAdmin = false,
        });

    return Results.Ok(new TokenResponse(token.ToJwt()));
})
    .WithName("GenerateLiveKitToken")
    .WithSummary("Gera um token JWT para acesso a uma sala LiveKit.")
    .WithDescription("Recebe nome da sala, nome do participante e papel mockado para emitir um token temporario.")
    .Produces<TokenResponse>()
    .Produces<ErrorResponse>(StatusCodes.Status409Conflict)
    .Produces<ErrorResponse>(StatusCodes.Status400BadRequest);

app.MapPost("/api/rooms/{roomName}/leave", async (string roomName, LeaveRoomRequest request, CastroomDbContext dbContext) =>
{
    if (string.IsNullOrWhiteSpace(roomName) || string.IsNullOrWhiteSpace(request.ParticipantName))
    {
        return Results.BadRequest(new ErrorResponse("RoomName e ParticipantName sao obrigatorios."));
    }

    var normalizedRoomName = NormalizeValue(roomName);
    var normalizedParticipantName = NormalizeValue(request.ParticipantName);

    var room = await dbContext.Rooms
        .SingleOrDefaultAsync(existingRoom => existingRoom.NormalizedName == normalizedRoomName);

    if (room is null)
    {
        return Results.Ok(new LeaveRoomResponse(false));
    }

    var participant = await dbContext.Participants
        .Where(existingParticipant => existingParticipant.RoomId == room.Id
            && existingParticipant.NormalizedDisplayName == normalizedParticipantName
            && existingParticipant.IsConnected)
        .OrderByDescending(existingParticipant => existingParticipant.JoinedAt)
        .FirstOrDefaultAsync();

    if (participant is null)
    {
        return Results.Ok(new LeaveRoomResponse(false));
    }

    participant.IsConnected = false;
    participant.LeftAt = DateTimeOffset.UtcNow;

    var hasAnyConnectedParticipant = await dbContext.Participants.AnyAsync(existingParticipant =>
        existingParticipant.RoomId == room.Id && existingParticipant.IsConnected && existingParticipant.Id != participant.Id);

    if (!hasAnyConnectedParticipant)
    {
        room.IsActive = false;
        room.Status = "ended";
        room.EndedAt = DateTimeOffset.UtcNow;
    }

    await dbContext.SaveChangesAsync();

    return Results.Ok(new LeaveRoomResponse(true));
})
    .WithName("LeaveRoom")
    .WithSummary("Marca um participante como desconectado da sala.")
    .WithDescription("Atualiza a presenca do participante e encerra a sala quando nao houver mais conexoes ativas.")
    .Produces<LeaveRoomResponse>()
    .Produces<ErrorResponse>(StatusCodes.Status400BadRequest);

app.Run();

static string NormalizeValue(string value) => value.Trim().ToUpperInvariant();

static async Task EnsureDatabaseReadyAsync(IServiceProvider services)
{
    const int maxAttempts = 12;

    for (var attempt = 1; attempt <= maxAttempts; attempt++)
    {
        try
        {
            using var scope = services.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<CastroomDbContext>();
            await dbContext.Database.EnsureCreatedAsync();
            return;
        }
        catch when (attempt < maxAttempts)
        {
            await Task.Delay(TimeSpan.FromSeconds(5));
        }
    }

    using var finalScope = services.CreateScope();
    var finalContext = finalScope.ServiceProvider.GetRequiredService<CastroomDbContext>();
    await finalContext.Database.EnsureCreatedAsync();
}

public sealed record TokenRequest(string RoomName, string ParticipantName, bool IsTeacher);

public sealed record TokenResponse(string Token);

public sealed record ErrorResponse(string Error);

public sealed record LeaveRoomRequest(string ParticipantName);

public sealed record LeaveRoomResponse(bool Updated);

public sealed record ActiveRoomResponse(string RoomName, DateTimeOffset StartedAt, int ConnectedParticipants, int ConnectedTeachers);
