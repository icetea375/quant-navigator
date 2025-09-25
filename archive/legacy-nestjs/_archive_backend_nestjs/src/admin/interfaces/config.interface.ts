export interface ConfigItem {
  configId: number;
  configType: string;
  configKey: string;
  configValue: any;
  version: number;
  isActive: boolean;
  description?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateConfigRequest {
  configType: string;
  configKey: string;
  configValue: any;
  description?: string;
  createdBy?: string;
}

export interface UpdateConfigRequest {
  configValue?: any;
  description?: string;
  updatedBy?: string;
}

export interface ConfigVersion {
  version: number;
  configValue: any;
  description?: string;
  updatedBy?: string;
  updatedAt: Date;
}

export interface ConfigChangeEvent {
  type: 'CREATE' | 'UPDATE' | 'DELETE' | 'PUBLISH' | 'ROLLBACK';
  configType: string;
  configKey: string;
  newConfig?: ConfigItem;
  oldConfig?: ConfigItem;
}

export interface ConfigAuditLog {
  logId: string;
  userId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'PUBLISH' | 'ROLLBACK';
  configType: string;
  configKey: string;
  oldValue?: any;
  newValue?: any;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
}

export interface ConfigMigrationResult {
  success: boolean;
  migratedCount: number;
  errors: string[];
}

export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
