/**
 * The site no longer takes payments (products are bought on doTERRA), so the
 * old NETOPIA endpoints answer 410 Gone instead of a redirect.
 */
function gone() {
  return new Response(null, { status: 410 });
}

export const GET = gone;
export const POST = gone;
