namespace Castroom.Models;

public sealed class Room
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string Name { get; set; } = string.Empty;

    public string NormalizedName { get; set; } = string.Empty;

    public string Status { get; set; } = "active";

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset StartedAt { get; set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset? EndedAt { get; set; }

    public string CreatedByName { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;

    public List<Participant> Participants { get; set; } = [];
}
