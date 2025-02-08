import { redirect } from '@sveltejs/kit';

export const load = ({ locals }) => {
	redirect(308, '/block');
};
