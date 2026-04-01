export interface Task {
  Id: number
  Title: string
  Description: string
  DueDate: string
  IsCompleted: boolean
  OwnerId: number
}

export let tasks: Task[] = [
  {
    Id: 1,
    Title: 'Сделать логин',
    Description: 'Форма email/password',
    DueDate: '2026-02-15',
    IsCompleted: false,
    OwnerId: 1,
  },
  {
    Id: 2,
    Title: 'Список задач',
    Description: 'Фильтрация и сортировка',
    DueDate: '2026-02-18',
    IsCompleted: true,
    OwnerId: 2,
  },
]
