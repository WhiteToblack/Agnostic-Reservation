import React from 'react';

type TenantOption = {
  id: string;
  name: string;
};

type TestToolbarProps = {
  tenantOptions: TenantOption[];
  selectedTenantId: string;
  defaultTenantName: string;
  onTenantChange: (tenantId: string) => void;
  onResetToDefault: () => void;
  isOverrideActive: boolean;
};

export const TestToolbar: React.FC<TestToolbarProps> = ({
  tenantOptions,
  selectedTenantId,
  defaultTenantName,
  onTenantChange,
  onResetToDefault,
  isOverrideActive,
}) => {
  return (
    <div className="test-toolbar" role="region" aria-label="Test toolbar">
      <div className="test-toolbar__group">
        <span className="test-toolbar__title">Test Toolbar</span>
        <label className="test-toolbar__control">
          <span className="test-toolbar__label">Sektör tenantı</span>
          <select
            className="test-toolbar__select"
            value={selectedTenantId}
            onChange={(event) => onTenantChange(event.target.value)}
          >
            {tenantOptions.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name}
              </option>
            ))}
          </select>
        </label>
      </div>

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
  );
};
