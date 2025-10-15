using System;
using System.Threading;
using System.Threading.Tasks;
using AgnosticReservation.Application.Abstractions;
using AgnosticReservation.Application.Users;
using AgnosticReservation.Application.Users.Models;
using AgnosticReservation.Domain.Entities;

namespace AgnosticReservation.Infrastructure.Services;

public class UserProfileService : IUserProfileService
{
    private readonly IRepository<User> _userRepository;

    public UserProfileService(IRepository<User> userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task<UserProfileDto> GetAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetAsync(userId, cancellationToken) ?? throw new InvalidOperationException("User not found");
        return Map(user);
    }

    public async Task<UserProfileDto> UpdateAsync(Guid userId, UpdateUserProfileRequest request, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetAsync(userId, cancellationToken) ?? throw new InvalidOperationException("User not found");

        if (!string.IsNullOrWhiteSpace(request.FullName))
        {
            user.UpdateName(request.FullName);
        }

        if (!string.IsNullOrWhiteSpace(request.PreferredTheme))
        {
            user.UpdateTheme(request.PreferredTheme);
        }

        if (!string.IsNullOrWhiteSpace(request.PreferredLanguage))
        {
            user.UpdateLanguage(request.PreferredLanguage);
        }

        user.UpdateContact(
            request.PhoneNumber,
            request.AddressLine1,
            request.AddressLine2,
            request.City,
            request.Country,
            request.PostalCode);

        user.UpdateBilling(
            request.BillingName,
            request.BillingTaxNumber,
            request.BillingAddress,
            request.BillingCity,
            request.BillingCountry,
            request.BillingPostalCode);

        await _userRepository.UpdateAsync(user, cancellationToken);
        return Map(user);
    }

    private static UserProfileDto Map(User user)
        => new(
            user.Id,
            user.TenantId,
            user.Email,
            user.FullName,
            user.PreferredTheme,
            user.PreferredLanguage,
            user.PhoneNumber,
            user.AddressLine1,
            user.AddressLine2,
            user.City,
            user.Country,
            user.PostalCode,
            user.BillingName,
            user.BillingTaxNumber,
            user.BillingAddress,
            user.BillingCity,
            user.BillingCountry,
            user.BillingPostalCode);
}
