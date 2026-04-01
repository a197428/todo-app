import { rest } from 'msw';
import type { Task } from '../data/tasks.data';
import { tasks } from '../data/tasks.data';
import { getUserFromAuthHeader } from '../utils/auth';

let lastId = tasks.length;

function makeTaskHandlers(base: string) {
	return [
		rest.get(`${base}/api/tasks`, (req, res, ctx) => {
			const authHeader = req.headers.get('authorization');
			const user = getUserFromAuthHeader(authHeader ?? undefined);
			if (!user) return res(ctx.status(401));
			return res(ctx.delay(300), ctx.json(tasks));
		}),

		rest.post(`${base}/api/tasks`, async (req, res, ctx) => {
			const authHeader = req.headers.get('authorization');
			const user = getUserFromAuthHeader(authHeader ?? undefined);
			if (!user) return res(ctx.status(401));
			const body = await req.json();
			const task: Task = {
				Id: ++lastId,
				Title: body.Title || 'Без названия',
				Description: body.Description || '',
				DueDate: body.DueDate || new Date().toISOString(),
				IsCompleted: false,
				OwnerId: user.id,
			};
			tasks.push(task);
			return res(ctx.status(201), ctx.json(task));
		}),

		rest.put(`${base}/api/tasks/:id`, async (req, res, ctx) => {
			const authHeader = req.headers.get('authorization');
			const user = getUserFromAuthHeader(authHeader ?? undefined);
			if (!user) return res(ctx.status(401));
			const id = Number(req.params.id);
			const taskIndex = tasks.findIndex(t => t.Id === id);
			if (taskIndex === -1) return res(ctx.status(404));
			const task = tasks[taskIndex]!;
			if (task.OwnerId !== user.id && user.role !== 'admin') return res(ctx.status(403));
			const body = await req.json();
			tasks[taskIndex] = {
				...task,
				Title: body.Title ?? task.Title,
				Description: body.Description ?? task.Description,
				DueDate: body.DueDate ?? task.DueDate,
				IsCompleted: body.IsCompleted ?? task.IsCompleted,
			};
			return res(ctx.status(200), ctx.json(tasks[taskIndex]));
		}),

		rest.delete(`${base}/api/tasks/:id`, (req, res, ctx) => {
			const authHeader = req.headers.get('authorization');
			const user = getUserFromAuthHeader(authHeader ?? undefined);
			if (!user) return res(ctx.status(401));
			const id = Number(req.params.id);
			const taskIndex = tasks.findIndex(t => t.Id === id);
			if (taskIndex === -1) return res(ctx.status(404));
			const task = tasks[taskIndex]!;
			if (task.OwnerId !== user.id && user.role !== 'admin') return res(ctx.status(403));
			tasks.splice(taskIndex, 1);
			return res(ctx.status(204));
		}),
	];
}

// Для браузера (относительные URL)
export const taskHandlers = makeTaskHandlers('');
// Для тестов (абсолютные URL)
export const taskHandlersNode = makeTaskHandlers('http://localhost');
