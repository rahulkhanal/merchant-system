export interface AuditLogProps {
  id: string;
  entityId: string;
  entityType: string;
  action: string;
  actorId: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export class AuditLog {
  readonly id: string;
  readonly entityId: string;
  readonly entityType: string;
  readonly action: string;
  readonly actorId: string;
  readonly metadata: Record<string, unknown>;
  readonly createdAt: Date;

  private constructor(props: AuditLogProps) {
    this.id = props.id;
    this.entityId = props.entityId;
    this.entityType = props.entityType;
    this.action = props.action;
    this.actorId = props.actorId;
    this.metadata = props.metadata;
    this.createdAt = props.createdAt;
  }

  static reconstitute(props: AuditLogProps): AuditLog {
    return new AuditLog(props);
  }
}
