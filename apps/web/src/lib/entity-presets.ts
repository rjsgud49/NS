import { EntityConfig } from '@ns/shared';

export interface EntityPreset {
  key: string;
  label: string;
  description: string;
  icon: string;
  entity: EntityConfig;
}

export const ENTITY_PRESETS: EntityPreset[] = [
  {
    key: 'user',
    label: 'User',
    description: '이메일·비밀번호·역할 기반 사용자',
    icon: '👤',
    entity: {
      name: 'User',
      fields: [
        { name: 'email', type: 'string', isUnique: true, isOptional: false, isArray: false },
        { name: 'password', type: 'string', isUnique: false, isOptional: false, isArray: false },
        { name: 'name', type: 'string', isUnique: false, isOptional: true, isArray: false },
        { name: 'role', type: 'string', isUnique: false, isOptional: false, isArray: false },
        { name: 'isActive', type: 'boolean', isUnique: false, isOptional: false, isArray: false },
      ],
      relations: [],
    },
  },
  {
    key: 'post',
    label: 'Post',
    description: '제목·본문·발행 여부를 가진 게시글',
    icon: '📝',
    entity: {
      name: 'Post',
      fields: [
        { name: 'title', type: 'string', isUnique: false, isOptional: false, isArray: false },
        { name: 'content', type: 'text', isUnique: false, isOptional: false, isArray: false },
        { name: 'slug', type: 'string', isUnique: true, isOptional: false, isArray: false },
        { name: 'published', type: 'boolean', isUnique: false, isOptional: false, isArray: false },
        { name: 'viewCount', type: 'number', isUnique: false, isOptional: false, isArray: false },
      ],
      relations: [],
    },
  },
  {
    key: 'product',
    label: 'Product',
    description: '이름·가격·재고를 가진 상품',
    icon: '📦',
    entity: {
      name: 'Product',
      fields: [
        { name: 'name', type: 'string', isUnique: false, isOptional: false, isArray: false },
        { name: 'description', type: 'text', isUnique: false, isOptional: true, isArray: false },
        { name: 'price', type: 'float', isUnique: false, isOptional: false, isArray: false },
        { name: 'stock', type: 'number', isUnique: false, isOptional: false, isArray: false },
        { name: 'sku', type: 'string', isUnique: true, isOptional: false, isArray: false },
        { name: 'isAvailable', type: 'boolean', isUnique: false, isOptional: false, isArray: false },
      ],
      relations: [],
    },
  },
  {
    key: 'order',
    label: 'Order',
    description: '주문 금액·상태·메모를 가진 주문',
    icon: '🛒',
    entity: {
      name: 'Order',
      fields: [
        { name: 'totalAmount', type: 'float', isUnique: false, isOptional: false, isArray: false },
        { name: 'status', type: 'string', isUnique: false, isOptional: false, isArray: false },
        { name: 'note', type: 'text', isUnique: false, isOptional: true, isArray: false },
        { name: 'paidAt', type: 'date', isUnique: false, isOptional: true, isArray: false },
      ],
      relations: [],
    },
  },
  {
    key: 'category',
    label: 'Category',
    description: '이름·슬러그를 가진 카테고리',
    icon: '🏷️',
    entity: {
      name: 'Category',
      fields: [
        { name: 'name', type: 'string', isUnique: false, isOptional: false, isArray: false },
        { name: 'slug', type: 'string', isUnique: true, isOptional: false, isArray: false },
        { name: 'description', type: 'text', isUnique: false, isOptional: true, isArray: false },
      ],
      relations: [],
    },
  },
  {
    key: 'comment',
    label: 'Comment',
    description: '본문·비공개 여부를 가진 댓글',
    icon: '💬',
    entity: {
      name: 'Comment',
      fields: [
        { name: 'content', type: 'text', isUnique: false, isOptional: false, isArray: false },
        { name: 'isPrivate', type: 'boolean', isUnique: false, isOptional: false, isArray: false },
        { name: 'likeCount', type: 'number', isUnique: false, isOptional: false, isArray: false },
      ],
      relations: [],
    },
  },
  {
    key: 'file',
    label: 'File',
    description: '파일명·URL·크기를 가진 첨부파일',
    icon: '📎',
    entity: {
      name: 'File',
      fields: [
        { name: 'filename', type: 'string', isUnique: false, isOptional: false, isArray: false },
        { name: 'originalName', type: 'string', isUnique: false, isOptional: false, isArray: false },
        { name: 'url', type: 'string', isUnique: true, isOptional: false, isArray: false },
        { name: 'mimeType', type: 'string', isUnique: false, isOptional: false, isArray: false },
        { name: 'size', type: 'number', isUnique: false, isOptional: false, isArray: false },
      ],
      relations: [],
    },
  },
  {
    key: 'notification',
    label: 'Notification',
    description: '제목·메시지·읽음 여부를 가진 알림',
    icon: '🔔',
    entity: {
      name: 'Notification',
      fields: [
        { name: 'title', type: 'string', isUnique: false, isOptional: false, isArray: false },
        { name: 'message', type: 'text', isUnique: false, isOptional: false, isArray: false },
        { name: 'isRead', type: 'boolean', isUnique: false, isOptional: false, isArray: false },
        { name: 'type', type: 'string', isUnique: false, isOptional: false, isArray: false },
      ],
      relations: [],
    },
  },
];
