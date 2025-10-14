namespace AgnosticReservation.Application.Localization.Models;

public record LocalizationKeyDto(Guid Id, string Key, string? Description, IReadOnlyDictionary<string, string> Translations);

public record LocalizationUpsertRequest(string Key, string Language, string Value, string? Description = null);
