// import supabase from '$lib/supabase'

// export async function load({ params }) {
//     const { data: { user } } = await supabase.auth.getUser()
//     const { data, error } = await supabase.from('chat_bots').select('*')
//     if (!user?.user_metadata) {
//         return {
//             user: null,

//         }
//     }
//     return {
//         user: user.user_metadata,
//         randomBots: data
//     }
   
// }