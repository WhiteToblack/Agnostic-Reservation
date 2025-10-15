using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AgnosticReservation.Application.Abstractions;
using AgnosticReservation.Application.Admin;
using AgnosticReservation.Domain.Entities;

namespace AgnosticReservation.Infrastructure.Services;

public class AdminNavigationService : IAdminNavigationService
{
    private readonly IRepository<User> _userRepository;
    private readonly IRepository<Role> _roleRepository;

    public AdminNavigationService(IRepository<User> userRepository, IRepository<Role> roleRepository)
    {
        _userRepository = userRepository;
        _roleRepository = roleRepository;
    }

    public async Task<IReadOnlyList<AdminModule>> GetModulesAsync(Guid tenantId, Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetAsync(userId, cancellationToken);
        if (user is null || user.TenantId != tenantId)
        {
            return Array.Empty<AdminModule>();
        }

        var role = await _roleRepository.GetAsync(user.RoleId, cancellationToken) ?? user.Role;

        var modules = new List<AdminModule>
        {
            new("theme", "Tema", "Uygulamanın görünümünü yönet.", "appearance"),
            new("quickActions", "Hızlı İşlemler", "Anlık aksiyonlar ve sık kullanılan araçlar.", "operations"),
        };

        if (role is null)
        {
            return modules;
        }

        if (role.IsSuperAdmin || role.HierarchyLevel >= 80)
        {
            modules.AddRange(new[]
            {
                new AdminModule("tenantParameters", "Genel Parametreler", "Tenant genelinde geçerli parametreleri yapılandırın.", "configuration"),
                new AdminModule("shopParameters", "Şube Parametreleri", "Şube bazlı çalışma saatleri ve kullanım kuralları.", "operations"),
                new AdminModule("integrations", "Entegrasyonlar", "Ödeme ve kanal entegrasyonlarını yönetin.", "integration"),
                new AdminModule("billing", "Faturalama", "Gelir ve faturalandırma ayarlarını yönetin.", "finance"),
                new AdminModule("cache", "Önbellek Yönetimi", "Tenant önbelleğini temizleyin ve yenileyin.", "maintenance"),
            });
        }
        else if (string.Equals(role.Name, "ShopAdmin", StringComparison.OrdinalIgnoreCase))
        {
            modules.AddRange(new[]
            {
                new AdminModule("shopParameters", "Şube Parametreleri", "Şubeye özel rezervasyon ve fiyat ayarları.", "operations"),
                new AdminModule("inventory", "Stok Yönetimi", "Şube stok seviyelerini güncelleyin.", "operations"),
                new AdminModule("team", "Ekip Yönetimi", "Çalışan yetkilerini ve izinleri düzenleyin.", "people"),
            });
        }
        else
        {
            modules.Add(new AdminModule("notifications", "Bildirim Tercihleri", "Kullanıcı bildirimlerini yönetin.", "communication"));
        }

        return modules;
    }
}
