export type Role = 'Заказчик' | 'Прораб' | 'Инспектор' | 'Админ';
export type UserStatus = 'Активен' | 'Заблокирован';

export interface UserRow {
  id: string;
  fio: string;
  role: Role;
  phone: string;
  status: UserStatus;
  lastLogin: string; 
}

export interface DictItem {
  id: string;
  title: string; // Заголовок строки справочника (например, "Закладка фундамента")
  description?: string; // Правая колонка ("очень важное..." и т.д.)
}
