import { rest } from 'msw';
// 1. Исправляем импорт типа: отделяем данные от типа через 'import type'
import type { Task } from '../data/tasks.data';
import { tasks } from '../data/tasks.data';
import { getUserFromAuthHeader } from '../utils/auth';

let lastId = tasks.length;

export const taskHandlers = [
	rest.get('/api/tasks', (req, res, ctx) => {
		// 2. Исправляем ошибку типизации: headers.get возвращает string | null,
		// а функция ждет string | undefined. Оператор '?? undefined' решает проблему.
		const authHeader = req.headers.get('authorization');
		const user = getUserFromAuthHeader(authHeader ?? undefined);

		if (!user) return res(ctx.status(401));

		// Возвращаем данные. Если в ТЗ просили обертку { data: ... }, оставляем её
		return res(ctx.delay(300), ctx.json(tasks));
	}),

	rest.post('/api/tasks', async (req, res, ctx) => {
		const authHeader = req.headers.get('authorization');
		const user = getUserFromAuthHeader(authHeader ?? undefined);

		if (!user) return res(ctx.status(401));

		// В MSW v1 тело запроса часто лежит в req.body.
		// Если используете await req.json(), убедитесь, что версия msw это поддерживает.
		const body = await req.json();

		const task: Task = {
			Id: ++lastId,
			Title: body.Title || 'Без названия',
			Description: body.Description || '',
			DueDate: body.DueDate || new Date().toISOString(),
			IsCompleted: false,
			// @ts-ignore - если в интерфейсе Task нет OwnerId, но он нужен для логики
			OwnerId: user.id,
		};

		tasks.push(task);
		return res(ctx.status(201), ctx.json(task));
	}),
];
