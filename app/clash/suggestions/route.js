import { GET as apiGet } from '@/app/api/clash/suggestions/route';

export async function GET(request) {
  return apiGet(request);
}
