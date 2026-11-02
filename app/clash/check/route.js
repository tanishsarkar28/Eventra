import { POST as apiPost } from '@/app/api/clash/check/route';

export async function POST(request) {
  return apiPost(request);
}
