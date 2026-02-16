# oscar-night

Join your friends to vote on the Oscar nominations.

Before the Oscars, you will get the opportunity to vote for who you think will win (of who you want to win!).

Then, join your friends on the night itself to watch each category and see how well you and your friends did.

## Tech Stack

This is a mobile responsive web app built with React and Tailwind CSS... powered by Vite.

It is a modern ESM stack, so make sure to use the latest LTS version of Node.js.

There isn't an authentication service, instead a host sets up a room and sends a link to their friends that contains the 4 alpha numeric code.

A friend then adds their name to the room and votes on the nominees. Honor system and all.

We need a datastore to store the room codes and the votes.