import React from 'react';

type TenantOption = {
  id: string;
  name: string;
};

type DomainOption = {
  id: string;
  host: string;
  label: string;
};

type TestToolbarProps = {
  domainOptions: DomainOption[];
  selectedDomainId: string;
  activeDomainHost: string;
  activeDomainDescription: string;
  onDomainChange: (domainId: string) => void;
  tenantOptions: TenantOption[];
  selectedTenantId: string;
  defaultTenantName: string;
  onTenantChange: (tenantId: string) => void;
  onResetToDefault: () => void;
  isOverrideActive: boolean;
};

export const TestToolbar: React.FC<TestToolbarProps> = ({
  domainOptions,
  selectedDomainId,
  activeDomainHost,
  activeDomainDescription,
  onDomainChange,
  tenantOptions = [],
  selectedTenantId,
  defaultTenantName,
  onTenantChange,
  onResetToDefault,
  isOverrideActive,
}) => {
  const hasTenantOptions = tenantOptions.length > 0;

  return (
    <div className="test-toolbar" role="region" aria-label="Test toolbar">
      <div className="test-toolbar__group">
        <span className="test-toolbar__title">Test Toolbar</span>
        <div className="test-toolbar__stack">
          <label className="test-toolbar__control">
            <span className="test-toolbar__label">Alan adı</span>
            <select
              className="test-toolbar__select"
              value={selectedDomainId}
              onChange={(event) => onDomainChange(event.target.value)}
            >
              {domainOptions.map((domain) => (
                <option key={domain.id} value={domain.id}>
                  {domain.host} · {domain.label}
                </option>
              ))}
            </select>
          </label>

          <div className="test-toolbar__meta" aria-live="polite">
            <span className="test-toolbar__meta-host">{activeDomainHost}</span>
            <span className="test-toolbar__meta-description">{activeDomainDescription}</span>
          </div>
        </div>
      </div>

      <div className="test-toolbar__group">
        <label className="test-toolbar__control">
          <span className="test-toolbar__label">Tenant seçimi</span>
          <select
            className="test-toolbar__select"
            value={selectedTenantId}
            onChange={(event) => onTenantChange(event.target.value)}
            disabled={!hasTenantOptions}
          >
            {hasTenantOptions ? (
              tenantOptions.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </option>
              ))
            ) : (
              <option value="">Tenant bulunamadı</option>
            )}
          </select>
        </label>

        <div className="test-toolbar__info">
          <span>
            Varsayılan tenant: <strong>{defaultTenantName}</strong>
          </span>
          {isOverrideActive && (
            <button type="button" className="test-toolbar__reset" onClick={onResetToDefault}>
              Varsayılanı kullan
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
