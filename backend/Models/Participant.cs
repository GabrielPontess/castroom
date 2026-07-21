namespace Castroom.Models;

public sealed class Participant
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid RoomId { get; set; }

    public Room Room { get; set; } = null!;

    public string DisplayName { get; set; } = string.Empty;

    public string NormalizedDisplayName { get; set; } = string.Empty;

    public string Role { get; set; } = "student";

    public DateTimeOffset JoinedAt { get; set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset? LeftAt { get; set; }

    public bool IsConnected { get; set; } = true;
}
