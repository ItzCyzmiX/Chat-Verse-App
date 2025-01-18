So, if you didnt know the project is built with Supabase, and the way i used to store messages is kinda, dumb. 
Basically i would create a json object called messages in user metadata and store all the messages their, this worked fine. But, when a user has many messages (on a single bot or across different ones) the size of the user metadata get so damn large, making it impossible to send throught a request, so i switched to a messages table, with all the messages of each user stored in it
I shouldve probably done this before, but i was tooo lazy to create a table for messages :)
