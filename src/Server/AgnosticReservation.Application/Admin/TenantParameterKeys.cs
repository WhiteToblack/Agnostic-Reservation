namespace AgnosticReservation.Application.Admin;

public static class TenantParameterKeys
{
    public static class Categories
    {
        public const string Auth = "auth";
        public const string Shop = "shop";
    }

    public static class Auth
    {
        public const string RequireKvkk = "requireKvkk";
        public const string KvkkText = "kvkkText";
        public const string RequireTwoFactor = "requireTwoFactor";
        public const string TwoFactorProvider = "twoFactorProvider";
    }

    public static class Shop
    {
        public const string DefaultShopId = "defaultShopId";
        public const string DefaultShopName = "defaultShopName";
        public const string DefaultShopTimeZone = "defaultShopTimeZone";
    }
}
