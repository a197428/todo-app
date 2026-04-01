import axios from 'axios';

export default defineNuxtPlugin(() => {
	const api = axios.create({
		baseURL: '/api', // Все запросы будут начинаться с /api
	});

	// Интерцептор для добавления токена в каждый запрос
	api.interceptors.request.use(config => {
		const token = localStorage.getItem('token');
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	});

	// Интерцептор для обработки 401 ошибки (выход из системы)
	api.interceptors.response.use(
		response => response,
		error => {
			if (error.response?.status === 401) {
				navigateTo('/login'); // Редирект на страницу входа
			}
			return Promise.reject(error);
		},
	);

	return {
		provide: { api },
	};
});
