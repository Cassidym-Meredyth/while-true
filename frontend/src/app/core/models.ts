// Типы данных, чтобы в компонентах все было типизировано.
export type Role = 'Заказчик' | 'Прораб' | 'Инспектор' | 'Админ';
export type UserStatus = 'Активен' | 'Заблокирован';

export interface UserRow {
  id: string;
  fio: string;
  role: Role;
  phone: string;
  status: UserStatus;
  lastLogin: string; // храню строкой "17 мая" — как в макете. При желании сделаем Date.
}

export interface DictItem {
  id: string;
  title: string; // Заголовок строки справочника (например, "Закладка фундамента")
  description?: string; // Правая колонка ("очень важное..." и т.д.)
}
