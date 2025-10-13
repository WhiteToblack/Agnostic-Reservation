using AgnosticReservation.Domain.Enums;

namespace AgnosticReservation.Domain.Entities;

public class Role : BaseEntity
{
    public string Name { get; private set; }
    public ICollection<RolePermission> Permissions { get; private set; } = new List<RolePermission>();

    private Role()
    {
        Name = string.Empty;
    }

    public Role(string name, IEnumerable<Permission> permissions)
    {
        Name = name;
        Permissions = permissions.Select(p => new RolePermission(Id, p)).ToList();
    }

    public bool HasPermission(Permission permission) => Permissions.Any(p => p.Permission == permission);
}

public class RolePermission : BaseEntity
{
    public Guid RoleId { get; private set; }
    public Permission Permission { get; private set; }

    private RolePermission()
    {
    }

    public RolePermission(Guid roleId, Permission permission)
    {
        RoleId = roleId;
        Permission = permission;
    }
}
