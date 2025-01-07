// import supabase from '$lib/supabase';

// export async function POST({ request }) {
//     const { data: { user } } = await supabase.auth.getUser()
//     const username = user.user_metadata.username
//     const { name, description, behavior, relationship } = await request.json();
//     let { data, error } = await supabase.from('chat_bots').insert({
//         name,
//         description,
//         behavior,
//         relationship,
//         creator: username
//     });
    
//     if (error) {
//         return new Response(JSON.stringify({ error: error }), { status: 500 });
//     } else {
//         let prevBots = user.user_metadata.createdBots || [];
//         const { data, error } = await supabase.auth.updateUser({ 
//             data: { 
//                 createdBots: [...prevBots, {
//                     name,
//                     description,
//                     behavior,
//                     relationship,
//                     creator: username,
//                     createdAt: new Date().toISOString()
//                 }]
//             } 
//         });
//         if (error) {
//             return new Response(JSON.stringify({ error: error }), { status: 500 });
//         }
//         return new Response(JSON.stringify({ message: 'Bot created' }), { status: 200 });
//     }
// }