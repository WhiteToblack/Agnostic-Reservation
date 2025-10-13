using AgnosticReservation.Domain.Enums;

namespace AgnosticReservation.Domain.Entities;

public class DashboardDefinition : BaseEntity
{
    public Guid TenantId { get; private set; }
    public Guid RoleId { get; private set; }
    public ICollection<DashboardWidget> Widgets { get; private set; } = new List<DashboardWidget>();

    private DashboardDefinition()
    {
    }

    public DashboardDefinition(Guid tenantId, Guid roleId)
    {
        TenantId = tenantId;
        RoleId = roleId;
    }
}

public class DashboardWidget : BaseEntity
{
    public Guid DashboardDefinitionId { get; private set; }
    public WidgetType WidgetType { get; private set; }
    public int Order { get; private set; }
    public string? ConfigJson { get; private set; }

    private DashboardWidget()
    {
    }

    public DashboardWidget(Guid definitionId, WidgetType widgetType, int order, string? configJson)
    {
        DashboardDefinitionId = definitionId;
        WidgetType = widgetType;
        Order = order;
        ConfigJson = configJson;
    }
}
