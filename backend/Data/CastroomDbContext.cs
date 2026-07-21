using Castroom.Models;
using Microsoft.EntityFrameworkCore;

namespace Castroom.Data;

public sealed class CastroomDbContext(DbContextOptions<CastroomDbContext> options) : DbContext(options)
{
    public DbSet<Room> Rooms => Set<Room>();

    public DbSet<Participant> Participants => Set<Participant>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Room>(entity =>
        {
            entity.HasKey(room => room.Id);
            entity.Property(room => room.Name).HasMaxLength(120).IsRequired();
            entity.Property(room => room.NormalizedName).HasMaxLength(120).IsRequired();
            entity.Property(room => room.Status).HasMaxLength(40).IsRequired();
            entity.Property(room => room.CreatedByName).HasMaxLength(120).IsRequired();
            entity.HasIndex(room => room.NormalizedName).IsUnique();
        });

        modelBuilder.Entity<Participant>(entity =>
        {
            entity.HasKey(participant => participant.Id);
            entity.Property(participant => participant.DisplayName).HasMaxLength(120).IsRequired();
            entity.Property(participant => participant.NormalizedDisplayName).HasMaxLength(120).IsRequired();
            entity.Property(participant => participant.Role).HasMaxLength(40).IsRequired();
            entity.HasIndex(participant => new { participant.RoomId, participant.NormalizedDisplayName, participant.IsConnected });
            entity.HasOne(participant => participant.Room)
                .WithMany(room => room.Participants)
                .HasForeignKey(participant => participant.RoomId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
