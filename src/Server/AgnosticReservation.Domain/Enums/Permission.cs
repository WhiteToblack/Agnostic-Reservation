namespace AgnosticReservation.Domain.Enums;

[Flags]
public enum Permission
{
    None = 0,
    ViewDashboard = 1 << 0,
    ManageReservations = 1 << 1,
    ManageTenants = 1 << 2,
    ManageParameters = 1 << 3,
    ManageDocuments = 1 << 4,
    ManageUsers = 1 << 5,
    ManageNotifications = 1 << 6,
    ManageInventory = 1 << 7,
    ManageBilling = 1 << 8
}
