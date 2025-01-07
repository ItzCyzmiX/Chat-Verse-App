// import supabase from '$lib/supabase'
// import { json } from '@sveltejs/kit'

// export async function POST({ request }) {
//     const { email, password, method, username } = await request.json()
//     if (method === "register") {
//         const { data, error } = await supabase.auth.signUp({
//             email: email,
//             password: password,
//             options: {
//                 data: {
//                     username: username
//                 }
//             }
//         })
//         return json({ data, error })
//     } else {
//         const { data, error } = await supabase.auth.signInWithPassword({
//             email: email,
//             password: password,
//             options: {
//                 data: {
//                     username: username,
//                     createdBots: []
//                 }
//             }
//         })
//         return json({ data, error })
//     }
// }