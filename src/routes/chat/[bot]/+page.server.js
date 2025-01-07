// import supabase from '$lib/supabase';

// export async function load({ params }) {
//     const { data, error } = await supabase.from('chat_bots').select().eq('name', params.bot);
  
//     if (error) {
//         return {
//             error: error
//         }
//     }
//     return {
//         bot: data[0]
//     }
// }