The Notion API, you've heard all the hype about it,
but what exactly is it?
Well my friends, the Notion API is essentially
a set of tools that you can use to connect
other web apps and tools up to your Notion workspace.
Or if you want, you can even use it
to build entirely new applications and tools
on top of Notion.
It can read data from your Notion workspace,
it can create new pages, it can add blocks to those pages,
update databases, it can do a lot.
But if you're not an experienced programmer,
then working with any API, let alone the Notion API,
can be a pretty intimidating experience.
And reading through the API docs,
trying to figure out how those work,
you might as well be looking at Egyptian hieroglyphs, right?
Well, wrong.
As of today, you are finally gonna go from confused
to confident when it comes to working with the Notion API
and reading those docs.
Because this is a complete crash course
for working directly with the Notion API
using some beginner level JavaScript.
And don't worry, even if you are not
a confident JavaScript coder,
I think that if you can follow along with this video,
well, a lot more confident about your coding skills
by the end of it, and you are gonna understand
how to work with the Notion API,
and actually pretty much any API,
because as I've learned, working with one API
kinda teaches you how to work with APIs in general.
And this video is gonna be very beginner focused
because I actually learned how to code myself
just this year.
This summer was when I started loading JavaScript
and I found myself quite frustrated
with a lot of API-centric tutorials in the past
because they were made by developers
who kind of assumed that you already knew
a lot of this beginning kinda setup stuff
that you're supposed to do to work with them,
and I didn't know that.
So in this video, we are not gonna skip those parts.
We are gonna go through everything that you need
in terms of setup and tools and knowledge and code
for working with the Notion API.
And my hope is that this video gives you
all the tools you need to start using the API
to build your own stuff.
And because learning sticks so much better
when we actually build something,
in this video, we are gonna build
a complete Pokedex inside of Notion.
Here is my Pokedex.
I have all 905 Pokemon inside of it.
We've got their stats, we've got their types,
we have their pictures.
There's even a page for each one with their flavor text.
But the coolest part of this Pokedex,
and the reason that it's pertinent to this tutorial
is that there was zero manual data entry used
to create this Pokedex.
All 905 of these Pokemon were brought
into this Notion page automagically using the API.
I built a simple script that fetches all these Pokemon
from another resource, the Poke API,
which is great for learning APIs,
and formats the data and then sends it over to Notion
and automatically creates these pages.
And that is what we're gonna be building in this video.
I'm gonna go step-by-step with you to recreate this script,
and we're gonna take a very iterative approach.
We're gonna start with what's called an MVP,
or minimum viable product, which is extremely simple,
uses very little code, and just demonstrates
how to connect to an API and get data from it.
And then as the video goes on,
we're gonna flesh out the script.
We're gonna bring in all the information we want,
like their names and their pictures.
We're going to format some of that information
to make it look a bit prettier.
And by the end, you're gonna have a lot more skills
when it comes to working with the Notion API,
and even with coding and JavaScript.
Now, before we get started with the tutorial overview,
you might have this question kicking around in your head,
which is, Tom, how much JavaScript do I need to know
to actually follow along with this tutorial?
And I'm gonna go ahead and make a bold statement here.
I think you can follow this tutorial
even if you've never programmed in JavaScript before.
And the reason I'm saying that is
I actually learned JavaScript this year,
but more importantly, when I've learned basically anything,
all my learning projects, in many cases,
I'll sort of reach way out of my comfort zone
and get kind of a handhold in an area
that feels like unknown territory.
And that actually kind of allows you
to do what's called backfilling,
where you kind of now have this north star
in that unknown territory,
and that allows you to go back
and go into some of the more beginner,
fundamental-oriented resources with more direction,
and that gives you more context
for what you're learning at that beginner level.
That said, if you do already have
some basic familiarity with JavaScript,
like declaring variables and creating loops,
that kind of thing,
you are gonna more readily understand
some of the code we're gonna go through here.
However, if you have never coded in JavaScript before,
I have strove, striven, strived,
to make this and the companion blog post
for this video a one-stop shop resource
for going from basically zero
to knowing what you're doing,
not only with the Notion API,
but also with coding JavaScript.
So you will find beginner-oriented resources,
free ones, linked in the description down below,
linked in that blog post,
and in the blog post version,
I also have little toggly accordion things
that explain a lot of the concepts
that I'll probably go a little bit faster over
in this video.
However, look at the length here.
This is not a short video,
and I'm not gonna be going super fast.
I'm more interested in thoroughness here.
I'm more interested in making this
a fundamentally useful evergreen resource.
So with that being said,
let's get into the tutorial by first going over
what exactly we're gonna be doing here.
Let's talk about kind of the spec.
So let's go through the spec first,
and we'll just kind of look at this Pokedex here
to get sort of a feeling for what we're gonna be building.
So what we want is to bring in all 905 Pokemon.
If you wanted to keep it to 151
or however many you wanted to,
that would be very easy as well.
And we wanna bring in several different stats.
So I'm gonna go over to this by number view
that I've created here,
and we'll look at the stats we wanna bring in.
So we wanna get the Pokemon's number.
We wanna get its name, its category.
So like seed Pokemon, lizard Pokemon,
all these cool things here.
We wanna get their types,
and if they have more than one, we wanna show both.
We'll get their generation.
We can actually get their sprite, which is pretty cool.
And then I wanna get their height, weight,
and then their base stats.
So HP, attack, defense, special attack,
special defense, and speed.
Also, if we open up one of these pages here,
I really wanna get their flavor text,
and then I wanna be able to generate automatically
a link to the Bulbapedia entry for this Pokemon,
and that will happen for each Pokemon
that we're going to be building.
Now, in most Notion tutorials I do,
I actually show you how to set up the Notion database
that you're gonna be using.
In this case, I'm going to skip over that.
I have created a template version,
and it's linked in the description down below.
So if you wanna know how to build this kind of thing,
I've got Notion database tutorials,
all kinds of projects that actually work
with the Notion UI itself.
So check those out if you are a little rusty
or want to learn more about Notion databases.
But to get started with this project,
just go to the description link down below,
and you'll find this Notion Pokedex template.
And there will be a duplicate button up in the corner,
so you can duplicate it into your own workspace.
And then it's basically just like a blank version
of my finished Pokedex.
I have one Pokemon in here as a reference,
but otherwise, it's pretty much just
a blank set of properties and a database here.
So that is what we're gonna be using,
and I have my own little video version right here.
And I'm gonna go ahead and delete
this little call-out block here,
because I don't need it.
I'm gonna be using this to build this whole pipeline
within this video.
And to move on, I wanna give you this high-level overview
of exactly what it is we're gonna do here.
So to give you a broad strokes intro,
the first thing I'll point out is this PokeAPI.
And you can find this over at PokeAPI.co.
And this is just this amazing resource
that has pretty much any piece of data about Pokemon
that you could possibly want in the format of an API.
Now, when I say API, what exactly do I mean?
API stands for Application Programming Interface.
And it is basically a set of instructions,
a set of tools that web applications give to the public,
or at least to people that they give authentication to,
to actually do things with those web resources.
So you can either get data from a web resource,
which is what the PokeAPI allows us to do.
With some other web apps,
we can actually push data to them,
or we can manipulate data that's already there.
And that's what we can do with the Notion API.
This is a very flexible API,
and lets us get data from Notion,
push data to Notion, create pages,
append blocks to those pages,
all kinds of really cool stuff.
So what we're gonna basically do
is pull data from the PokeAPI,
we're going to feed it through some code
that we're gonna write to make the data
in the format that we need,
and then we're gonna push that data to Notion
to create a new page for each Pokemon
inside of our Pokedex.
And if we look right here,
there's actually this really convenient try it now box.
And actually, I think the PokeAPI
is mainly built as an educational resource.
I have found that this is a wonderful way
to start playing with APIs and learning how to use them,
because number one,
it's what is known as a get-only API.
So you can't really screw anything up,
you can only get information from it.
And number two, it's a Pokemon-based API.
What could be more fun to mess around with
than a Pokemon API?
In my humble opinion, absolutely nothing.
So yeah, right here we have this try it now button,
and we can see that we are accessing its Pokemon,
what's called endpoint,
and then we're passing Ditto as the Pokemon we want to see.
And if I change this to, let's just say Charizard,
and hit submit, I'm going to get the resource for Charizard.
So we can start digging into this.
And if you watched my video on using make.com
to bring YouTube data into Notion,
you may have seen the part where in the make.com setup,
we actually went through some data
that looks very similar to this.
This is basically the API responding
with a bunch of arrays and objects in JavaScript.
So we can actually look through this,
and this is basically JSON data.
We can be the raw JSON if we want to,
but it's much easier to go through
and actually look at the dropdowns here.
And we can see, we have abilities here.
We can toggle that closed, we have forms.
And I'll point out a few really useful
pieces of information.
So we have the name right here, Charizard.
We have the ID, it's Pokemon number six.
We have its stats.
So I've got its base stat for HP,
its base stat for attack, and so on.
And we even have sprites.
So we can go in here, and they've actually uploaded
all the sprites from the Pokemon games for each Pokemon,
which will allow us to display the Pokemon pictures
inside of our Notion template here.
So essentially, what we want to do
is grab information from this Poke API
about each of these Pokemon,
and then we want to send it on to Notion.
And I'm gonna break out the whiteboard here,
because I think it's gonna be a lot easier
to explain what we're gonna be doing
if you can see it visually.
So essentially, we are going to be interfacing
with the Poke API first,
and we're gonna do that from our own development environment
which is gonna run on something called node.js.
And that is basically a backend way
to run JavaScript on a server.
So that is what Glitch is basically gonna give us.
And then we are also gonna be working with the Notion API.
So here is a bit of a breakdown
on the process we're gonna go through.
The first thing we're gonna do
is we're gonna actually request information
from the Poke API.
So I'll just write rec here.
And if that request is successful,
we are going to get a response.
So the response as it is, is basically raw information.
And we can't just send it onto the Notion API.
We first need to actually wrangle with that information
and put it into a format that Notion wants.
And also we wanna pull out only the information
that we really want to actually track,
which I just went through in the little Pokedex example.
So HP, stats, that kind of thing.
So first we are going to parse the data.
Then we're gonna create what's called an object
that holds all the data that we want in particular.
And that object is going to correspond
to a singular Pokemon.
So we're gonna get all the Pokemon
and each one will have an object
which we will put into one giant array.
And then finally, we are going to format the objects
in that array, or basically make new objects out of them
that are in the format that Notion actually wants.
And then once we've done that,
we will send that information to the Notion API
with what's called a post request.
And while I'm writing that,
I should note that this is called a get request.
And then if that request is successful,
a new page will be created at Notion
and then we will get back a response
that we will simply log.
So this is essentially a high level overview
of what we're gonna be building.
And now that we've kind of gone through it,
let's actually start to build this
and get into the fun part.
Maybe that'll work, I'm not sure.
All right, so it is building time, my friends.
And we're gonna be building this
on a platform called Glitch,
which you can find over at glitch.com.
And the reason we wanna build it on this platform
is Glitch basically gives you an entire environment
for writing web applications in the cloud.
So you don't have to have an IDE installed,
you don't even need a text editor,
and you don't need Node.js on your computer.
This is basically gonna give you everything that you need
and you can also write your code in their editor.
So to start, you can go over to glitch.com
and I will have the link to my code in the description.
So if you want to study it, you can do so.
I have meticulous comments on every single line of the code
in the actual editor here.
And then I have a no comments version as well
if you just wanna study it without any of those comments.
So once again, if you just want to
either get this running for yourself without any effort,
or you want a very easy starting point
for making modifications,
you can simply hit remix right there.
But we are actually gonna be building this from scratch.
So I'm gonna go over to the Glitch homepage.
And once you have an account with Glitch,
you can just hit new project.
And that's gonna give you a whole bunch
of different starter apps here.
So I'm going to choose Glitch Hello Node.
And that is because we wanna use something called Node.js,
which once again is sort of a backend server runtime,
it's called for JavaScript.
Basically lets us run JavaScript on servers
where classically you can only run it
inside of the browser.
And that basically just gives you like the ability
to write JavaScript, which a lot of people like to do
pretty much anywhere they want.
So I will choose Glitch Hello Node
as my little project starter.
And it's gonna basically bring in a whole bunch of stuff
that gives us sort of a shortcut, like a headstart.
So once this is actually spun up,
I'm gonna have that there.
And I guess I have it now.
So quickly we can run through all the things
that we've been given.
We have a basic readme.markdown file,
which has got some explanations
of everything going on in here.
We have a package.json,
which is basically gonna have information
about different packages that we are bringing in,
like external libraries, things like that,
along with some other information about our app.
So we'll be modifying this in a little bit.
And then we have a server.js file,
which basically just runs this server here.
We are not gonna be messing with this at all.
In fact, if I go over to my actual Glitch project,
you will notice that I have deleted a lot of the things
that it automatically generates.
But one thing I haven't deleted is this server.js.
And I believe we need to actually have this here.
So the first thing I wanna do is create for myself
a brand new file, which I'm going to call index.js.
I'll click add this file.
And now I have it added to my little list here.
Now, Glitch is going to look like this for you.
I'm actually going to turn on a set
of little CSS customizations that I've created for Glitch,
which will make it a lot easier for me to fit my face
on the screen, along with the code
that we're gonna be writing here.
So don't freak out if your editor doesn't look like this.
I have actually messed with it
using a little CSS extension called Stylebot,
which is right here.
So before we start writing code
and start trying to mess with the APIs,
we need to set up our Notion workspace
so that we can actually connect with it
inside of this Glitch project here.
So I'm gonna go over to Notion now.
And if I go to my settings and members area,
and then I go to connections,
and I believe you could get to it by my connections as well.
Yes, so either connections or my connections.
At the bottom of this little page here,
we have this develop or manage integrations link.
So let's go ahead and click that.
And this is where we can actually create an integration
that will allow us to use the Notion API
and allow the Notion API access
to our particular workspace.
So to get started,
I'm gonna click new integration right here.
I'm gonna call this Notion Pokedex.
And I'm not gonna worry about the accent
over the E for this tutorial.
I'm gonna call it video demo.
And that's actually all I need to do.
So I do wanna make sure
that it has these following content capabilities,
reading, updating, and inserting.
And then I don't actually need to give it user information.
So I'll click that radio button right there
and I will hit submit.
I also wanna make sure
that this is set as an internal integration.
I'm not building a public integration.
I'm not building an app for any of you.
I'm teaching you how to build your own
so I can leave that as internal.
And here I can actually get my integration token.
Now, this is something that you do not want to share
with anybody else.
You can copy it and I'm actually going to delete it
after this tutorial is done.
So yes, you wanna keep this secret from anybody else
because this is basically what would allow anybody
to access your integration
and then mess with any Notion pages
that this integration has access to itself.
But now that I got this,
I wanna come over to my brand new Glitch instance here.
And I wanna create a file called .env.
And this stands for environmental variables.
This is basically gonna be the place
where we will store our Notion integration key
that we just copied,
as well as the ID to our database that we want to work with.
And the cool thing about .env files on Glitch
and in many other places,
is they are typically not shared
when you say remix a Glitch project,
like you can do with mine,
or when you say push code to GitHub
if you're working on it with like a Git.
So I want to add variables inside of this little .env file.
The first one is going to be Notion,
in all caps, underscore key.
And in there, I'll paste my little secret key there.
And then the other one is gonna be
Notion underscore database, underscore ID.
And I can go over to my Notion database here
and make sure that I'm on the one
that I want to actually use.
So Notion Pokedex video.
And I will actually open up this database as a full page
because I wanna get the ID of the database itself.
This is something that's important to realize.
So if you're not very familiar with Notion databases,
I would highly recommend checking out my Notion database,
full video tutorial.
But I will point this out here one more time.
This page is not actually the database itself.
It contains the database.
So if I have this here,
I wanna make sure I can open it as a full page
and verify that I'm on the database itself.
And I can verify that when I go to the three dot menu here
by looking for the presence
of this little lock database option.
If I don't have it, then I'm not actually on a database.
I don't want this option.
I actually want this copy link option here
because what I need to do right now
is get the database ID from this page's URL.
So I'm gonna open up just a little notepad window here
and paste that URL there
to show you how you can get your database ID.
When you get the URL for your Notion database,
after this final trailing slash
and before this little question mark V equals,
you're gonna find your Notion database ID.
So that right there is the piece of data that you want.
So I'll copy that.
And then going back over to my little .env file,
I'm going to paste that in there.
And now my .env file is perfectly set up
and there is nothing else that I need to do.
So again, if you wanna use my code
and you just wanna start generating a Pokedex,
that is all you really need to do over on the glitch side.
The only other thing you need to do is come back to Notion.
And I'm gonna go back to my Pokedex video area.
I can do this on the database itself, but I'll do it here.
I wanna come back to the three dot menu here,
come down to the connections menu,
and then I want to find the integration
that I just created, which was Notion Pokemon video tutorial.
So I've got here Notion Pokemon video demo.
We'll have access to this and all child pages.
This is that cascading permissions that I often talk about.
So I'll click confirm here.
And now the reason I did this
is I want to demonstrate this to you.
I can see that this integration
or connection has access to this page.
And if I come into the database itself,
it's also got access and I can see here
it's from Notion Pokedex video.
That is the page that has actually been granted access
for this connection, which means all child pages,
including this database are available
to this connection as well.
And once you've got that done,
if you've got my code handy in your glitch instance,
you can actually just run that index.js file
in the terminal.
You would type node index.js inside of the terminal here,
and that would start bringing Pokemon
into your little Pokedex here.
But we want to go further.
We want to actually build this
and find out what is actually happening.
So to do that, I'm gonna first bring that over here
just so you can see my face on the side of your screen.
We're first going to start working with the Poke API
because we want to start getting information from it
and seeing what that looks like.
So to do that, I want to go back to my index.js here.
So first we're gonna go over to the Poke API.
And the first thing that I want to show you here
is the check out the docs link here,
which you should also find right there
at the top of the menu.
This is basically your Bible for the Poke API.
It will show you how to get access
to pretty much any piece of information that you want.
And you will see that right here.
So I'm actually gonna go down to Pokemon
and underneath Pokemon, which is kind of a general category,
I'm gonna go to Pokemon again.
And we can see here that if we send a get request
to this URL, which I will show you how to do
in just a second, we're gonna get all of this information
for the specific Pokemon that we pass it.
And we can see right here that we can pass either a name,
so that would be like Charmander,
or we can pass an ID, which would be,
I believe, four for Charmander.
So either way, we're gonna get all of Charmander's
information that is listed here
if we pass that particular URL.
So to do this inside of our code,
we're actually going to use a JavaScript library
that is called Axios.
And you can find that over at axios-http.com.
I'll have that link on screen.
And this is basically a library that's gonna allow us
to more easily interface with APIs
and get information from them,
as well as send information to them.
So I'm basically gonna start this process out
by bringing in Axios into our Glitch project
and actually kind of writing this function here.
So we're gonna go over to Glitch.
And the first thing I wanna do is pop up my drawer here
and head over to this little package.json area.
And you'll notice up here
that I have this add package option here,
where I can actually add packages from what's called NPM.
And NPM is a package manager for Node.
It's called Node Package Manager.
It's basically this giant repository
of all sorts of useful things, useful packages,
that you can bring into your code and then use
instead of having to write tons and tons of code
for yourself.
So we're going to bring in our Axios package.
So if I just search for Axios, you'll be able to find it.
I'll click right there.
And then you'll notice that Axios has been added
to my dependencies right here.
Hey there, Future Tom here with a little note
about these packages here in package.json.
When I recorded this tutorial three months ago,
we were on Axios 1.1.3, which was working just fine.
Today, January 11th, 2023, we are on 1.2.1,
which is also working just fine.
But after I finished recording this tutorial,
they updated to 1.2.0, which was not working.
So I do wanna let you know really quick
that if you have a package that isn't working
at any point in the future,
maybe an update happens and it breaks something,
you can always roll it back to a stable version
that you know works.
In this case, we know that 1.1.3,
the package version that I was using
in this tutorial actually works.
So here in package.json, I can actually delete this 1.2.1
and I can go 1.1.3 and that will roll it back
to the 1.1.3 version.
We can go up here and actually see
that now it's prompting us to update.
I could do that, that would work.
But if you wanted to use 1.1.3, you could just type it there.
You can also go into your terminal and you can do npm list.
And that's gonna bring up a list
of all the different packages in your projects.
If we go up here, we can actually find Axios
and here it is 1.1.3 and we have a couple of warnings here,
but we can see that making that change in package.json
actually did make the change here on Glitch.
So we are using this version of the plugin.
One of the notes, I am gonna have a pinned comment
below this video with any other changes that may happen
since I can't change the video once it's live,
but things that this code may rely on
might change in the future.
So check that pinned comment
if you have any other problems.
The other one that I wanna bring in is actually Notion.
So if I search for, I believe, at NotionHQ.
So NotionHQ slash client is the Notion API,
what's called SDK, I believe.
So I can bring that in there as well.
And now my project is going to have access
to both of these external packages.
And we don't need to bring in a package for the Pokka API
because number one, I don't even think one exists.
Maybe it does, I can actually search for it.
But number two, we are going to be working with it
entirely through Axios.
So it actually looks like there are a bunch of them.
We do not need these, we're gonna use Axios in general.
And I picked Axios because I'm gonna be doing some tutorials
for a platform called Pipe Dream in the future,
which is mega powerful, and they use Axios
as a sort of default HTTP client in many of their tutorials.
So that's what I've learned,
and I think it would be useful for you to learn as well.
So what do we actually do here?
Well, the first thing we wanna do
is actually bring in what are called require statements
so we can use those external packages
that we've just created.
If we look over at my project,
we can see that the first thing we wanna do
is bring in our Axios client here.
So I'm gonna define a variable,
and I'm writing JavaScript in case you aren't quite sure
or haven't really messed with it before.
I'm gonna call it Axios,
and then I'm gonna set it equal to require Axios.
So I've now brought that into my code.
I'll do the exact same thing for Notion as well.
So I'll do const Notion equals,
and let's check out,
because I believe this one's a little bit different.
Yep, so it's client.
There we go.
And then the next thing we're gonna do
is create a variable called Notion,
and I'll just copy this in as well.
This is gonna create a variable called Notion
that basically allows us to access
that Notion integration key we just created.
And you can see here,
we're accessing it through process.env,
that .env file, .notion key,
which if we go back to our env file just to look,
we can see is the key that corresponds
to that particular value.
So that's how we're getting it
into our actual index.js file here.
Now, the first thing that we're gonna do
is very simply get some information from the Poke API here.
And the way that we're gonna do that
is by calling a method called axios.get.
Now, if we look at the Axios documentation here,
we can actually see exactly what we're supposed to do.
We call axios.get, we pass it the URL that we want,
and then we can put a .then clause
where we basically define a function
for how we're going to handle this.
And then we can also have a catch block
for handling any kind of errors.
So let's go ahead and do that.
And one thing we are gonna wanna do,
which I'll scroll down here to sort of highlight here,
is we are gonna wanna eventually put this
into an async function.
And that is because Axios is a library
that returns what's called a promise
from this get method here.
And that gets into some pretty intermediate JavaScript.
I'm gonna be putting some resources
in the description down below
in case you are curious about that.
But the gist of it is the thing
that this is going to return first
is a promise to either get the information successfully
later on, or to tell us that it failed to do so.
And because the promise itself
doesn't really hold any information,
if we don't put this
in what's called an asynchronous function
and tell our code to wait for this to finish,
then we're gonna have other things kicking off
that would need the information
from this piece of code right here,
but aren't gonna get it.
So we kinda wanna make sure
that this totally finishes up before we do anything else.
So going back to how we have things set up here,
we can see that we are creating
what I'm calling the poke array,
which is gonna be an array full of Pokemon.
And then we're doing everything else
inside of this asynchronous function.
So let's go ahead and create that.
I'm gonna go with another const here.
I'm gonna call it poke array,
equals just an empty array there.
And then I'm going to create myself an asynchronous function.
And inside of this function,
we will actually do our stuff.
So very, very simply,
we just wanna get some information
about a single Pokemon from the poke API.
So let's go over to the poke API.
One more time.
And let's look at this little piece of text right here.
This is our Pokemon endpoint
where we can get things like the name,
the weight, the height, stats, all kinds of cool stuff.
So I'm gonna copy this right here.
And I'm gonna start writing my first little bit of code here.
I'm gonna call this weight axios.get.
Oops.
I'll paste this in here.
And then let's just put a one here
to get information about the very first Pokemon,
which is Bulbasaur.
From there, we want to pass the result from this
into a .then function.
But to keep my code a little bit cleaner,
I can actually put it onto another line.
So I can do .then.
And then I'll use what's called an arrow function
to basically take the response from this,
put it into a variable called poke,
which is my favorite food,
and then do something with that variable.
So the first thing we're gonna do is simply log it.
So I'm gonna do console.log poke.
We also want to add error handling here.
So we're going to add a catch block.
It's gonna be kind of the same thing.
I'm gonna call this error.
If there's an error,
it's gonna be thrown into that error variable.
And we will console.log the error if it happens.
The last thing we need to do is actually invoke
this function.
So I'll do get Pokemon down here.
And now when I run my index.js,
I should be able to get some information from the Poke API.
Now there's a terminal right here,
which you could run right on the glitch editor.
Because I have limited screen space to work with
on this tutorial,
I'm gonna be doing it in their full page,
a little terminal here.
And I'm gonna run node index.js and see what happens.
And here you can see,
we actually got a response from the Poke API.
Now there's a lot of information in this response.
So it's not super useful to us right now,
but it is good to just see that all you need
to get information from an API is this bit of code,
and then making sure you've brought in that Axios package.
And Axios isn't the only way to get information from an API.
There's like a stock HTTP module and node.
There's all kinds of stuff, but Axios is easy and free.
But if we come down here,
we can see we have things like name Bulbasaur,
we have order one, we have species Bulbasaur,
and I've actually found out the species name
is more useful than the plain Jane name right here.
We have all kinds of sprites here.
So what we can start doing is instead of just logging
the entire response,
which is stored in this Poke variable here,
we can start to actually get some of the information
from this response and add it to different variables.
So the first one I wanna create,
I'm gonna call it const, let's call it name.
And I'm gonna set that equal to Poke.name.
And let's see what happens if I console log just the name.
So this will autosave.
I can come over here and I can type clear
to clear out my terminal,
and then I can hit up to find my pass commands.
And it looks like we have an undefined error.
So this is something you're gonna find yourself
doing quite a lot when you start coding
and building with APIs.
So you're gonna wanna go back to the API documentation
and see what the problem is.
Well, I have, let's see here,
do I have name as an actual value inside of this endpoint?
I do.
So I need to figure out why
I'm not actually getting the name itself.
So one more time, let's go ahead and log Poke.
And see what the issue might be here.
Ah, so if we look at the response,
we can see that data is the object that contains
all of these other objects and properties.
So of the entire response,
which we have put into the Poke variable,
we need to first specify that we want to access
the data object and then the name object.
So I will now modify this to be Poke.data.name.
And now if I log name,
clear again,
I get Bulbasaur.
Look at that.
So what we could do is just start defining
a bunch of variables like HP,
and we could just go on down the line
and store all of these pieces of data
from our API response in a specific variable.
But instead of doing that,
I want to define what's called an object.
And that object is going to hold key value pairs,
which are gonna be a lot more, I guess, easier to work with.
So I'm gonna call this const Poke.data.
This is yet another variable,
but it's going to be equal to an object.
And to start defining that object,
I'll use the curly braces here.
And now I can actually start creating keys
inside of this object or properties,
which are gonna be key and value pairs.
So there I can do name,
and it's gonna be in quotations with a colon there.
I'm gonna hit comma,
and I'm gonna start filling in
these actual variables later on.
First, I just want to actually define
everything that we want here.
So I'll do name.
I'll do, let's do number to make things clear.
Let's do HP, attack, defense, special attack,
special defense, special K, speed.
For now, let's just do these stats,
and we'll add height and weight as well.
So I'll go up in here, add them like that.
Okay, so now we need to figure out
how to access each of these pieces of data
within our response from the Poke API.
So once again, let's go back
to our handy-dandy documentation.
And we know that to access the name,
shall I zoom in even more if I can here?
Woo, there we go.
We know that to access, I think to the top,
the name property, we need to go poke.data.name.
So using that pattern,
we know how to access basically anything else.
For instance, if I come to species
and I want the name from species,
I would want to do poke.data.species.name.
So let's go ahead and actually change up our variable here.
So we're gonna go poke.data.species.name.
And then we can kind of go on down the line
using this as our reference to get everything that we want.
So ID is gonna be the Pokemon's number.
So that'd be poke.data.id.
And then to find our height and weight,
I believe those were actually just sitting there.
Yep, height and weight.
And then for HP, looking back at the documentation,
we can see that we have a stats array here.
And an array is essentially an ordered list
of objects or values or variables.
And in the documentation,
it's only giving us one of those array elements,
and that is the one for speed.
But I know that there are more than that.
So I'm gonna go back to the Poke API homepage here.
I'm gonna pass Pokemon slash one as an example.
And let's actually look at the resource for Bulbasaur here.
So we'll come down, we'll find a little stats array.
And yeah, we can see that there are actually six items
in the stats array, with HP being the first one,
attack being the second, defense, special attack, speed.
And I wanna make sure that that actually holds true
for other Pokemon.
So I'm gonna go ahead and throw,
let's just say 685 in there, slurpuff.
And let's make sure that the order is the exact same.
So we've got HP, attack, defense, special,
special defense and speed, cool.
So we know that the order of these stats
is the same for every Pokemon,
which means we won't have to do anything fancy
like digging into these arrays of objects
and searching for key and value pairs.
We have to do that later.
So don't you worry if that was something
you wanted to get into, because we will be getting into it.
But for now, we can actually just call our array indices.
So for HP, I know that's the first one.
So we'll go poke.data.stats.
And then to call a specific array element,
we'll use a bracket here and we'll put the actual index
of that array.
And then looking back one more time,
we know that the actual HP is base stat.
So if we add dot base stat, then that should be correct.
So now all we need to do is copy this piece right here
and paste it into all the other stats
that are inside of that stats array.
So I'll paste there, there, there.
And now I wanna make sure that I edit my array indexes
for each of these to make sure
that they go in the correct order.
And I do remember it was HP, attack, defense,
special attack, special defense and speed.
Arrays use zero based indexing
if you're not familiar with them,
which means that we have six different stats,
but the first one starts at zero.
So our final one stops at five.
So now we have an object called poke.data
that should have all these different stats inside of it.
And to double check, we can now console.log poke.data.
Go back over to our console here,
clear our previous commands.
And look at that, we've got our name,
we've got a number and all of these useful stats.
So now that we have a little bit of data from the Poke API,
let's actually try to send that to Notion
and see what happens.
And from there, we can start to refine and build our loops
and make things actually automated
and go through the entire Pokedex.
But for now, we're just gonna send
this little old Bulbasaur to Notion.
And to start that process off,
I actually wanna come back up here to the top
and start using this poke array variable.
You will notice that this has been defined
in what's called the global context.
Essentially, I've not defined this variable
inside of a function,
which means any other function that we create
is gonna be able to access this variable.
So that's not very useful right now
because the array is empty
and my poke data is basically locked inside of this function.
But what I can do is push this object
onto our poke array here.
So I'm gonna do that by coming down here
and typing poke array.push,
which is the method for pushing objects
or values onto the end of an array.
And I'm gonna pass in poke data as my value there.
So now when I run this,
we're gonna get all the information from poke API.
We're gonna construct our object
and then we're gonna push that object
onto the end of poke array.
And because poke array is empty,
it's gonna be the only element inside of it.
The next thing we wanna do is come down here
and define our notion function.
So once again, I'm gonna make this an async function
and I'm gonna call it create notion page.
We'll take in no arguments.
And within this, I wanna start out
by creating what's called a for of loop.
And this is basically a looping construct
that is gonna take an array
and then do something to every single element of that array.
And that's gonna be very useful later
when our poke array starts growing
to potentially 905 Pokemon.
So to do that, I will type four
and we'll do let Pokemon of poke array.
So essentially this is defining a brand new variable.
And each time this loop runs,
its value is gonna be set
to whatever the next index of this array is.
So right now it's just gonna be basically given
the value of poke data up here,
since we're only gonna have that one element
inside of poke array.
So within that, we wanna actually start creating an object
that notion is going to be able to interface with.
And that is gonna be our introduction
to the notion API itself.
Now, maybe you've watched my no code tutorials
on how to interact with the notion API without coding.
Here, we actually have to learn how to interface with it
and how to basically structure our data
in the way that they need it to be in.
So to do that, you're gonna go over to developers.notion.com
and this is going to become your best friend
as you go through this wonderful adventure
of building applications that interface with notion.
And there are guides up here.
There are even example projects which live on glitch.
So you can study these.
That's actually how I found out about glitch.
I looked at this live example here,
but the main useful thing that you're gonna find here
is the API reference right here.
And this is essentially the Bible for the notion API.
And it shows you how everything is supposed
to be structured when you send data to notion.
So the piece of information
that we are most interested in right now
is this create a page right here option
underneath the pages subheading.
And this will kind of show us
how notion actually wants its data to be structured.
And we can look right here
in this little notion SDK for JavaScript
and kind of get an example of what we need to build
inside of our own application.
In fact, you can basically just copy this if you want to,
but I think it's gonna be better
if you actually build these things yourself
and see how they work.
We can see here that we wanted to find a variable
and I'll try to zoom in more if I can.
There we go.
We wanted to find a variable called response
and this is gonna hold a response from notion
once we create our page.
And then we're going to actually use
this notion.pages.create method
to create a new page inside of our notion workspace.
And then we can basically pass it
all the data that it wants,
including this little parent value here.
And this is going to specify the database
in which the page is going to be created.
So I'll zoom back out a little bit here
so we can see things a bit more clearly.
And this is kind of be our reference
for actually building our function over in Glitch.
So inside of our little for loop,
we're gonna define const response equals await.
And we're using await here because once again,
the notion API may not instantly return
the response that we want.
So we wanna make sure that the rest of our code
is waiting for this to finish.
So going back over here to once again,
reference what we're supposed to do,
we wanna call notion.pages.create
and we're gonna pass it an object.
So do, do, do, notion.pages.create.
And inside of this object,
we're going to be defining more key and value pairs.
So the most important one that we need to define right now
is going to be our parent.
And parent is going to be an object.
If we go back, once again,
you're just gonna be referencing this all day long.
It's gonna be an object with type database ID
and then database ID passing the actual value here.
Type will be database ID,
database ID.
And here we can actually bring in our .env value here.
So instead of actually typing that database ID
that we copied to our clipboard earlier,
we've already defined it in the .env file,
which means that we can simply type process.env.notion
database ID as our database ID.
And we are good to go there.
So the next thing that we want to define are our properties.
And just so we're all speaking the exact same language here,
our properties are gonna be all of these little, again,
key and value pairs that we see inside of Notion.
So we wanna be able to set our HP, attack, defense,
all that good stuff.
So to do that, we're gonna create a properties object here.
And once again, take a gander at how that is structured.
Now, every different property type has a different way
in which it is structured.
And to see how they're all structured
underneath page object here in the sidebar,
you can go to this property values option.
You'll notice that there are two different options here,
property values and property item object.
Hey there, Future Tom here,
once again, interrupting this tutorial very briefly
to give you an update on something that has changed
since I recorded it.
The Notion API documentation now only has one page
underneath this page object dropdown here.
And you're gonna see in a couple of seconds
in the original recording
that there were two different options.
I believe it was page property values
and page property object.
They have since consolidated everything
into one page property value page here.
So I'm gonna leave the explanation
of why there were two in the video,
otherwise things are not gonna make sense.
But just know going forward,
everything that I talk about on that page reference
is gonna be here in page property values.
Once again, check that pinned comment down below
if there are any other changes or updates
that I need to let you know about.
I can't change them in the video itself,
but I will be able to let you know about them
in that pinned comment.
So because we're trying to send information to Notion,
we wanna go over to property values
and we're gonna start looking at the relevant properties
that we need to actually work with
given the data that we're using.
So remind yourself very quickly while I drink this coffee
of the data that we have specified
that we wanna work with.
One more time, we'll go back to it.
We have a name, that's gonna be a text property
or the title property.
We've got number, that'll be a number.
We've got HP, height, weight, attack.
All of these are actually going to be
simple number properties.
And I wanted to start with those
because they're very, very simple.
So if we go to our property values here,
we've got a handy dandy little table of contents
and we can click on title
and see exactly how title is structured here.
And you'll notice that title
and also simple rich text property values
are kind of complicated.
So I would invite you to just basically pause the video
for a second or maybe go over to the reference yourself
and study what is exactly happening here.
I'll zoom in so we can go through it.
We are actually defining the name of the property right here
and it corresponds to an object where we have title
and that's an array of objects itself.
And these are text objects.
So kind of study this.
And as you use this more and more in your code,
you're gonna get really good
at basically bringing this up for memory.
But at first it can be kind of hard to work with.
So I may have to actually refer back to this one more time,
but I'm gonna come down here
and our first property is going to be,
let's reference and make sure
that our name property is indeed name.
So I'll go to a table view and it is name, cool.
So it's gonna be name.
And name is going to contain an object with the title array.
And looking back here,
cause it's hard to keep a memory,
that array contains objects where it's type text
and text is an object itself, cool.
So create ourselves an object with a type property
and then a text object.
And within our content property here,
we wanna pass what?
We wanna pass our variable,
which is gonna be, if you look up here, pokedata.name.
Except it's not pokedata.name
because we're using this for of loop here.
We're taking each element from poke array,
which is that entire object,
pokedata was just the definition of that object
and we're putting it into Pokemon.
So we'll come down here with the pokemon.name.
Remember to access individual properties of an object,
all you need to do is call the object name.
Again, that is Pokemon and then the property itself.
So pokemon.data in this case.
And now let's go ahead and set up our number properties.
So at a comma here,
we wanna always separate sequential objects with commas,
otherwise we're gonna get the syntax error.
And we'll go back over
to our handy dandy notion documentation.
I will zoom out a couple of times
to get our table of contents back
and we'll look at the number property values here.
Numbers are way, way, way easier.
All you need to do is create an object
that contains the name of the property
and then that's an object with number and the number value.
Very, very easy.
So I'm gonna do one of these expanded like this
and then we're going to see
how you can actually compress it.
So the first one is going to be,
let's put a comma at the end of name object
and bring in no.
So that should allow us to add number here
and then the value of number is gonna be Pokemon.
Let's reference our keys here, .number.
So Pokemon.number.
And now we can do basically the same thing
for all of our other values here.
So if we wanna do HP,
now instead of hitting enter,
I can actually just create my object in here.
We don't have to use new lines.
So I'll do Pokemon.HP for that one.
And to save myself a bit of effort,
I will copy this and paste it a few more times.
Oops.
Remembering to put commas each time
and I'll change these as needed.
And once again, I will note that these key values here,
because this is what we're actually sending to Notion,
these must correspond to the actual property names
as they are spelled.
So now I'm coming on to the special attack property.
And if we go up to our Pokedata object definition,
you can notice here that there is a dash
between special and attack and the special and defense.
To actually reference this property here,
we have to use what's called bracket notation.
When objects or properties have just a single word
as their key, or if it's multiple words with underscores,
we can use this dot notation here.
We just go like Pokemon.name.
But if it has multiple words or it has dashes,
we cannot do that.
We actually have to do bracket
and then we have to actually spell it out like so instead.
So we'll do the exact same thing for special defense here.
And then I'll finish up all of our other numbers.
Cool.
So now we have all of our properties,
our number properties defined.
We've got our name defined
and we've defined this directly
in this awaitNotionPages.create.
So this should, once we actually call this function here,
actually send a new page to Notion.
Now to do that, we have to actually invoke
this function here.
And I could do it at the bottom of our script here,
but if I do that,
it's not actually gonna get any information
to send to Notion.
Because once again,
we're using an asynchronous promised face function
to get all this information from the Poke API.
So we actually wanna call our createNotionPage function
within this function.
So after this catch block here
and after this whole awaitAxios call,
I wanna make sure I'm doing it within this function.
So after here, I will simply call createNotionPage.
And because we already have Bulbasaur
as our first little reference Pokemon,
let's actually change the number in this API call to two.
So we grab Ivysaur.
And to see what's actually happening,
I do wanna add a little bit of logging to our script here.
So instead of console.logging.pokedata,
why don't we put console.logging.fetching?
And this is what's called a template literal.
So it's basically defining a string
with these backtick characters.
And that will actually allow me to call variables
and write code inside of the string itself.
And I can do that with a dollar sign
and then a curly brace pair.
So I'm gonna say fetching pokedata.name from Poke API.
So we'll log that when it actually runs the call.
And then let's add a couple of more here.
So let's add a log right before this.
Console.log, sending the edit in ocean.
And finally, after this, let's log the response.
And now we should actually be able to get information
from this whole process inside of the terminal.
So let's go back over to our terminal.
Let's make sure it's clear
and then let's run index.js and see what happens.
All right, so looking at our logs here,
it says fetching Ivysaur from Pokemon API.
Awesome, sending data to Notion.
And then we actually got a response from Notion
and we can see that it was successful
because we have a brand new page ID.
So let's go back over to Notion
and see if we can find our newly created Pokemon.
And that's weird.
It's not actually showing underneath Bulbasaur.
And I think the reason there is that
we did not define the generation
that we are setting for the Pokemon.
And we are currently not displaying any Pokemon
that don't have a generation property set.
So I need to come in here and go into my grouping
and show no generation.
I'll drag it out to the top
and let's see if we get anything there.
There it is, Ivysaur.
And we don't have any picture data,
but we do have the number.
We have our HP, attack, defense, and all these stats.
And then we have a few different formulas
that are using these stats to translate them
into meters, kilograms, all that kind of good stuff.
Which means we now have our first API created page
inside of our Notion Pokedex.
If you followed me so far, pat yourself on the back
because you just used JavaScript code
to create something in Notion.
And hopefully it feels just as good for you
as it felt for me when I figured this out
for the first time.
So at this point, all we need to do
is take our little MVP here
and start basically fleshing it out.
So we wanna start adding some of those images in here.
We want to basically format the name
so it's capitalized.
We wanna add our category text or types,
all that kind of good stuff.
But the first thing I wanna do
before we start fleshing that out
is get more than one Pokemon from the Poke API
and deliver multiple pages to Notion at once.
And if you have been following along so far,
you will know that our code is almost already set up
to do this because inside of our create Notion page array
here, we have set up our little for of loop.
So as long as the array that we're working with,
this Poke array has more than one element,
then this is gonna be executed for all of the elements,
which means all we need to do is pack this array
with more than just one Pokemon.
How are we gonna do that?
Well, of course, we're gonna use another loop
inside of our get Pokemon function.
So I'm gonna enter down from here.
And for this part, I wanna use an old school for loop
where we're actually going to define
how many times we'll loop through
directly in the declaration for the loop.
So I'm gonna do four, let i equal zero.
Actually, I think it's gonna equal one to start
because we wanna actually go by the numbers in this URL.
We are going to say i is less than,
and let's say less than 10 or less than equal to 10.
So we're gonna pull 10 different Pokemon
and then i is going to increment by one
each time the loop successfully runs.
So we'll create a little curly brace pair there.
And now I wanna go grab this entire function
that we've created, and I want to cut it
and I wanna paste it inside of our loop.
So now we're gonna be running this bad boy
every single time we go through the loop,
but for a new Pokemon.
I'm gonna tab that in just for a bit more readability.
And now we want to adjust the API URL that we are calling.
And just a side note here, when working with APIs,
you may have seen that there are many different commands
you can use such as get and post and put
and all kinds of other ones, patch, delete.
Well, here we can see that we are using
the get command here, which is pulling information
from this resource.
But this is no good because we're gonna go through this loop
10 different times and every single time
we would be pulling the information for Ivysaur.
So instead of a statically coded URL here,
we're gonna turn this into a template literal
by changing those single quotes into back ticks.
And that will allow us to pass the value of I in our URL.
So now if the value of I is one,
we're gonna be calling slash Pokemon slash one,
which is Bulbasaur.
If it's say 657, it's gonna be 657 here.
And whichever Pokemon is there
is gonna be pulled as well.
And that's basically all we need to do
to get the loop working.
So we already have Ivysaur, we already have Bulbasaur.
Let's go ahead and set I to three.
So the first one that pulls is Venusaur
and we'll go back and run our script one more time.
So arrow up, node index.js.
And when I hit this, I should get fetching information
for I believe it's eight different Pokemon here.
So let's try it.
There it is, there it is.
And we're getting logs for all of these brand new
created Notion pages.
If I scroll all the way back up, we can see we fetched
all of these different Pokemon from the Poke API
and then we sent data Notion for all of them.
So going back over to our handy little Notion workspace,
we can see that we now have a nice shiny entry
for all of these different Pokemon.
We are now making our way through this process.
At this point, all we really need to do
is start massaging the data to make it look the way we want
and adding a few more pieces of information
like our category, our type, our generation,
all that kind of good stuff.
But hopefully now you're seeing how you can actually
call an API multiple times using a loop
to get multiple pieces of information,
store that in a temporary holding place,
the array that we're building,
and then use another loop to send those pieces
of information one by one to another API,
in this case, the Notion API.
So at this point, it's gonna be a process of refinement
and we're gonna start using some more advanced code
to do some interesting things like manipulating strings
and capitalizing things and all kinds of good stuff
like that.
So this is gonna be a bit more of an advanced section
of the tutorial.
And once again, you can, as always, look through the code
and study it for yourself.
One nice thing to know is now that we've basically set up
our call to the Notion API,
and this is just all of my code and VS code as reference,
it's not gonna be a whole lot more complicated
to add more blocks and more properties
to our call to Notion.
That part is actually pretty easy.
What's gonna be a bit more complicated
is doing things like removing new lines
from data that we get,
basically massaging data to make it look the way
that we want.
And sometimes we're gonna be using
multiple different functions in sequence to do that.
So if the first part of this tutorial was 101,
this is now 102 or 201,
or however colleges like to use their naming conventions.
I haven't been to college in a long time.
I'm kind of ancient at this point, and that's okay.
I just wipe away the tears every day.
The existential dread is at bay for now.
Okay, so the first thing that we wanna do
is start getting some more data from our Pokemon endpoint.
Because we got our name, we got our number, we got our HP,
let's see what else we can get from that particular endpoint.
And of particular interest to me
is gonna be our sprites here.
If I actually grab, let's just take this,
actually I wanna come down here to the official artwork.
If I grab this URL and I go to it in my browser,
we can see that we get the official artwork
for this Pokemon.
And we actually wanna bring that into our Notion Pokedex.
So let's learn how to actually access that,
again, from the Poke API.
Well, once again, we know that all of this
is contained within an object called data.
So we're gonna go data.sprites.other.officialartwork.frontdefault.
That is a mouthful, but we are going to push through
and figure it all out.
So remember that the call to the Poke API
through axios.get was basically stored
in this little Poke variable here,
which allows us to use that as the base object
and then access the inner objects just like this.
So once again, we're gonna add ourselves
a brand new property here,
and we're gonna call it sprite.
And that is gonna be poke.data.sprites.
And I actually wanna get two different sprites from here.
I wanna get the default sprite,
which is the more pixelated one.
And I'm gonna set that as my little icon.
And then I wanna get the official artwork as well.
So this one's a bit easier to do.
So I'm gonna copy this value right here,
sprites.frontdefault.
And notice that we have an underscore here,
and underscores are totally fair game
when it comes to dot notation,
which means I can come over here
and simply call it just like that.
And then I'm gonna do one more called artwork.
And for that one, we're gonna dig a little bit deeper.
We're gonna go to data.sprites.other.
And let's reference it one more time.
Other, official-artwork, and then frontdefault.
So for official-artwork,
we're gonna have to use bracket notation.
Going back here.
So let's get rid of that dot.
Let's do official-artwork.frontdefault.
So let's go back to the actual project here.
Look at our object definition here
and see if there's anything else that we are missing.
And I can see a couple of different things that we are.
We're missing this bulb URL property here.
That's gonna get our Bulbapedia URL.
We are missing the types.
And then our name has been changed
to a variable here called processed name.
And if we come back up here,
we can see that process name is quite a mouthful.
So we're gonna come back to that in a little bit.
And another interesting thing is we can see
that our sprite property here
is calling a variable called sprite.
The reason that we have to do that,
and I think we'll start there,
is there are, I believe, six new Pokemon
that were introduced in Legends Arceus or Arceus.
I'm not sure how you pronounce that.
But they don't have actual sprites.
They are like 3D renders only in that game.
There are no sprite data.
And that is gonna be a problem for us
because if we're trying to call
that specific sprite property there,
for those Pokemon, we're not gonna get it
and we're gonna get an error in our code.
So let's go ahead and create this little bit here
in our code.
And this is gonna be a conditional statement,
which basically is like an if-then statement.
So let's go ahead and say const sprite equals.
And to define what is inside this variable,
we're gonna create a conditional statement
using what's called ternary syntax.
And that is basically using
what's called the ternary operator.
If you wanna learn about it
in my Notion formula documentation
inside of the if page under operators,
there's a whole bit about how it works
under, I think it's like shorthand syntax.
And this basically explains what is happening.
So check that out if you are curious,
but I'm just gonna go with the bang here.
And I believe it's gonna be poke.data.sprites.
Yep.
Dot front default.
And because I'm putting the bang operator here,
basically if the value of this property here is null,
which means it doesn't exist,
that essentially means it is falsy.
In a Boolean sense, like a true false sense.
And if it is falsy,
then the value of sprite is instead
going to be our official artwork.
So the then condition comes after the question mark,
the first part of the ternary operator.
And the else condition will come after a colon.
And that's gonna be the actual sprites front default value.
Which means that for those very new Pokemon
that don't have a sprites front default,
they're just gonna have their sprite value
set to their official artwork.
And everything else is gonna get
a nice cool pixelated sprite.
Then we can come down here to sprite
and we can change this to our sprite variable there.
And we can move on to the next thing,
which is gonna be our types array.
So we wanna get the types of each Pokemon.
And I'm going to set this to a variable
that I'm gonna call types array.
So we need to actually create that up here.
And the reason we have to do this
is if we go into the Notion documentation,
zoom out to get my table of contents back,
and we look at multi-select property values,
zooming back in for easiness,
we can see here that to send multi-select data
to a Notion database,
we first define the name of the property,
and then we pass in an array
that contains all the different multi-select options
we wanna set.
And Pokemon can have either one or two types.
We don't know until we get the actual data
from the Poke API.
So we need to dynamically create our multi-select array
with each type for each Pokemon.
So to do that, let's go ahead and create ourselves an array.
I'm gonna call this const types array.
And that is gonna be set to an empty array at first.
Then we're gonna get ourselves
yet another handy dandy for loop.
So it's gonna be for,
and we'll go let type of,
and we need to figure out what is the array
that we're going to be looping over here for this loop.
Well, let's go back to the Poke API,
and let's take a look at the types array right here.
So it's gonna be data.types.
So if we come back here,
it's gonna be let type of poke.data.types.
In here, we can actually create an object.
So let's just do const type obj.
I'll do type obj, that's fine.
And it needs to basically be in the format
that it's going to expect here.
So type obj is going to be essentially this value right here,
which means all it needs is a key and value pair.
So it's gonna be name.
And remember, it has to be name.
And the value is gonna be type,
because again, we are taking the value of this array
at the specific index and bring it in there.
So it'll be type.
And let's look at our documentation once again.
So type.type, because this is the object
inside of the array index that we wanna access, .name.
So type.type.name.
And then to finish this up,
we will push this type object onto the types array.
So we'll do types array.push,
and we'll pass type object or type obj.
So this will loop through this array,
which is again returned by our API.
It will create an object for each type
that it finds in that array.
And then we're gonna push that onto our own custom array,
which again is formatted the way that Notion wants.
And then we take types array,
and we pass that as the value of the types property
in poke data.
So we've got our types,
and let's look once more at my example project
to see what else we need.
Lastly, we need our bulb URL,
and we need our processed name.
So let's take a quick look at bulb URL.
And we can see here that we are essentially
defining a variable that contains
the normal Bulbapedia website URL here with slash wiki.
And then we're taking the processed name
and running it through replace function,
and finally ending with underscore Pokemon.
So let's take a look at why we need to do it that way.
And I'm just simply going to Google Bulbapedia.
So if we look at the Charizard URL here,
and I'll bring it up on notepad,
we can see that, well, this is formatting itself very weird.
It's not actually like that in the Chrome address bar,
but we can see that we basically have a template here,
the name of the Pokemon underscore, and then Pokemon.
If I search for Bulbasaur,
then we're gonna get the same old story,
which means that if we can get a name
formatted just like this,
then we can dynamically generate a link
to basically any Bulbapedia link for any Pokemon,
all 905 in fact.
So to do that, let's first create
our little bulb URL property here.
That's gonna be quite easy.
And then we're gonna create our processed name variable,
which as you can see here is quite a bit tougher to build
and has a lot of edge cases that we have to deal with.
So let's create this really quickly.
I'm gonna grab this value here,
but I will actually type out the rest
just to explain what I'm doing.
So once more, let's just do it beneath sprite.
We'll do const bulb URL equals template literal.
Here's our base of our URL.
And then we're going to pass in the value of a variable,
which is as of yet undefined,
but it will be in a couple of seconds.
Processed name, underscore,
and we'll come back over here
so I don't have to figure out
how to type accents on my keyboard.
It's way harder than it needs to be on Windows.
So now all we need to do is figure out
what process name is gonna be.
But first let's come down here and actually define this.
So create one more key value pair.
I'm gonna call it bulb URL,
and it will be set to bulb URL.
So that is gonna be ready to go
once we have our processed name variable set.
So let's go ahead and do that.
This is gonna be probably the most technical part
of the tutorial.
So let's define a process name variable,
and then let's explain exactly what is happening
and why we need it to happen.
So you can see that we are taking
that poke data species name,
and we're running it through a whole bunch of functions here.
And if you are not used to this sort of verbose
and compressed JavaScript code,
you would usually see one function being called,
and then the result of that being thrown into a variable,
and then we'd call another function on that variable.
But one cool thing about JavaScript
is you can basically just chain a whole bunch of functions,
and the return value of a split
is just gonna get fed into this map function,
which is gonna get fed into this join function,
and so on and so on and so on.
You can just chain these together all day long,
which is pretty cool.
So what we need to do is take the name
that the poke API gives us,
which if we look here under species name,
and capitalize it,
and then deal with any punctuation spaces,
that kind of thing.
Let me pull another Pokemon as an example here.
Let's see here.
I think it's Mr. Mime with a dash.
Yep.
We can see here that our species name property
is Mr. dash Mime,
which is no good,
because we want Mr. capitalized with a period,
space Mime capitalized with a period.
And if we look for Mr. Mime on Bulbapedia,
we can see that it's written exactly like that.
And even in the URL,
bringing back my notepad here,
we've got Mr. underscore Mime underscore.
So we have some text processing to do here,
and we're gonna do it all in one big batch of calls
under processed name.
Let me actually rename the processed name.
I don't wanna typo myself there.
So first let's actually get the name value.
We can just copy that from name and go like that.
And then we wanna first split it.
So let's walk through this step-by-step.
This is very, very complex looking,
but I guarantee you if we walk through it step-by-step
and you stay with me,
you are gonna understand what is happening.
So if I go to split here and I add that on there,
I'll just copy it.
This function is going to essentially split this string
into an array of smaller strings.
And it's gonna look for the dash
as the character it will split on.
If I wanted to actually save the dash as well,
I could put the dash in parentheses,
but I don't actually want to do it.
This is also where I'm going to introduce
a very useful resource that you're always gonna want
to have in your back pocket.
And that's gonna be the MDN
or Mozilla Developer Network Web Docs for JavaScript.
Usually these are in dark mode.
This is terrible.
What's going on here?
Much, much better.
Okay, basically any method in JavaScript,
there is full and comprehensive technical documentation
on MDM for it.
So if I wanna know how split works,
I will look for split
and I can see string.prototype.split.
That is the exact method that I want to look at here.
And we can see it takes a pattern
and divides a string into an order list of substrings,
which will be an array,
by searching for the pattern
and then putting the substrings into an array.
And we can see a try area here.
We have syntax.
We even have examples down here.
So there's all kinds of very, very useful
reference information on MDN.
Highly recommend bookmarking this resource
if you're gonna be doing this kind of development
in the future.
So what I'm passing in my split here
is what's called a regular expression.
And I define that by these two forward slashes
and then I can put my expression inside of there.
I am not gonna go super into regular expressions
in this video,
but I will note that number one,
MDN has a great resource on regular expressions.
I believe it's under regexp.
Yep.
So all kinds of good stuff there.
Also, regular expressions are very handy
in Notion formulas.
So over on my Notion formula reference,
which I will have linked down below,
I've got a whole regular expressions
in Notion formulas reference guide here.
And this shows all the regular expressions
that you can use inside of Notion.
And I have found that playing around
with regular expressions in Notion formulas
is kind of like a great little sandbox playground
for understanding how to use them in JavaScript.
And it's been kind of cool to have spent months
hammering away at Notion problems
where my only tool was crazy regexp usage
because we don't have things like arrays and functions.
And then to get into this kind of stuff with JavaScript
and realize, oh, I know regular expressions
and I can kind of actually use them.
So use them and try them out in your Notion formulas
and then try them out in your JavaScript code as well.
So basically, and we can actually log this
to show you what's gonna happen
is we're gonna split this into an array.
So why don't we do this?
Let's do console.log, process name.
And this is a great way to learn how to code actually,
just simply logging things as you build them
and then adding a little bit of complexity
and then logging that.
And let's go ahead and comment out
create Notion page here.
We don't actually want that.
And now let's go ahead and run this one more time.
So processed name, we're splitting it.
What we should get from this is an array of values
where we find a dash character.
And I know already that we are calling
several different Pokemon
that are not going to meet the criteria here
because they all have one word in their name.
So let's make sure that Mr. Mime
is in our original group here.
122 is his number.
We'll go over here and we're gonna set this at 120
and we'll set the end at 130.
So coming back down here, we're gonna log our process name.
And what we should get is an array with one value
for everything except for Mr. Mime's entry
which should have two values.
Let's go over here once again, clear this, run it
and see what happens.
All right, we have type error here.
Cannot read property front default of undefined.
What's going on there?
Go back to the code and oh, I can see that I forgot
to put data in front of sprites there and front default
and there as well.
So hopefully that gets rid of our errors there.
Let's clear once again.
Fetching star you and here we go.
Now we're getting arrays.
Remember process name is a variable
that is getting the value returned by the split function
which always returns an array.
So we get an array with one element for each of these
except for Mr. Mime's because we split Mr. Mime's string
on the presence of that dash character.
So that is our first little call here, the split function.
The next one is a bit more complicated.
We're gonna use the map function to make sure
that every word in a Pokemon's name is capitalized
on the first letter.
So Mr. Mime, right?
Bulbasaur, Gabagool.
Where's the freaking Gabagool?
I wish there was a Pokemon named Gabagool.
Okay, so coming back here, we'll paste this in.
We'll make sure we have a dot.
And once again, we're gonna go over to handy dandy MDN
to see exactly what the heck we are doing here.
So back over to MDN, we're gonna search for map
and we're using array prototype map.
So we can see here the map method creates a new array
populated with the results of calling a provided function
on every element in the calling array.
And this is actually a really good way to explain it here
with the demo they have here.
So we are calling map on array one,
which just has some numbers.
Every element is a simple number.
And the function that we are going to apply
to every element of this array one by one
is we're gonna take that element
and assign it to X and then multiply X by two.
And then we're gonna get a brand new array
that has the value of running
that element through the function.
So here we have two, eight, 18, 32,
which is double of each one here.
So going back to our code,
what the heck are we doing with our instance of map here?
Well, we are mapping each element returned by split
and we're putting it into the value of name.
So if we have Mr. and Mime,
the first time map runs on the first element
of the returned array, it's gonna be on Mr.
So name's value will be Mr.
And we are returning this right here.
And what exactly is this?
Well, when we do name and then we pass an index like this
on a string, and remember this name is a string right now,
it's just the string of Mr.,
we can access specific characters in that string.
So we are accessing the first character,
which will be the M,
and we're passing it to the two uppercase function,
which just makes it uppercase.
And then we are concatenating it,
basically adding it on to a substring.
And the substring function,
once again, we can go back to our MDN, substring,
takes in a string and returns the part of it
between the start and end indexes
or to the end of the string if we only pass one.
So we can see here, we are passing in Mozilla.
If we go string or str, which is this variable here,
dot substring two, we get Zilla
because we're going zero, one, two,
returning that to the end
because we did not provide an index there.
So the logic here is we want to capture
that first character in the string, the M in Mr.
and capitalize it and then return the rest of the string
and mash those two things together.
So now map is going to return a brand new array,
which contains capitalized Mr., capitalized Mime.
But that is an array still,
and we want a string to end this up.
So going back, what are we passing this into?
We're passing this into a function called join.
So I can now copy this part.
Add that bad boy on there.
And let's take a look at what's going on here.
Join, and we were passing that a simple space.
So handy dandy MDN, go back to the join method right here.
And we can see join method creates and returns a new string
by concatenating all of the elements in an array
separated by commas or by the specified separator string.
This is the important bit here
because if I just passed in something like this,
fire, air, water with just join and no separator string,
I would just get a comma separated list like that.
I don't want that, I want a space.
So I want to pass a space as my separator character.
So let's go ahead and log a process name one more time
now that we've added all of this stuff on here.
I'll clear this again, run node,
and where's Mr. Mime?
Boom, there he is right there, Mr. Mime.
That is almost what we want.
So the last thing we need to do
to finish up this process name variable
that we're declaring here
is to run it through a bunch of these replace calls.
And I'm only gonna explain it once,
and then you can kind of get the gist
of what's happening on all of the other ones.
So we're gonna go back once again to handy-dandy MDN,
find that replace function,
and we can see here the replace method
returns a new string with one sum
or all matches of a pattern replaced by a replacement.
In plain English, we are going to be looking
for some kind of pattern in a string,
and when we find it, we're gonna slice that out
and we're gonna replace it with something else.
So if we look here at my first one in my code,
I am passing .replace.
Let's actually put that in there,
and I'm gonna enter it onto its own new line
just for readability.
We are looking for the first instance of this pattern,
Mr. M, and I know there's only one Pokemon
that has that pattern,
and we're gonna replace that substring
with Mr. M.
So to finish this up,
all I need to do is pass in the rest of my replace calls,
and each one of these is handling another edge case.
Mime Jr., Mr. Rime, I think Ho-Oh's in there.
We've got Nidoran female and male
with these sex symbols that are actually in the game files.
We are replacing those with the actual symbols,
and this gives us one big robust chain of method calls
that makes your process name
always gives us a good-looking name.
And then the last thing we need to do,
because we are just passing process name right here,
we wanna make sure that we replace any space characters
from process name with underscore characters
when it is called in this bulb URL.
So I'm gonna do .replace once again,
and I'm going to look for any space like that,
and I'm going to replace with an underscore.
And to prove that it worked, let's go ahead and log it.
Okay.
Go back to our console, clear, and run it one more time.
Cool, Bulbpedia jinx underscore Pokemon.
Where is Mr. Mime, Mr. Mime Pokemon?
That is exactly how it's supposed to be.
So we are good with all of our processing now.
We can make sure that we are calling bulb URL down here,
and now we also wanna make sure
that instead of poke.data.species.name,
we call the new variable
that we just spent so much time working on,
so we can actually use it.
So now that we have made our poke.data object
a bit more robust,
why don't we actually pass this information to Notion?
That'll be the next kind of step in this process.
Well, let's come down here,
and now we wanna start just defining the properties
that we are gonna be working on here.
So the first thing that I'm gonna focus on
is types right here, and this should be pretty easy,
but we can come back over to our property values area
in the Notion API, zoom out,
so I get my nice little table of contents,
and once again, let's look at multi-select property values
and see how we are supposed to get this formatted.
Here we go.
So we're gonna call the name of the property.
We're gonna pass that an object
containing a multi-select array,
and that is actually just gonna be our types array.
So we can actually just do tags
or whatever it's called, types array.
So let's look at our Pokédex template here
and see what this is called.
It's type, so instead of tags, it would be type.
Let's come up into our properties
or just down into our properties,
and I guess I'll just put it after my number property here.
So we'll do type, and that'll be an object.
I'm actually gonna keep it on one line,
add my trillion comma, and then I need to do multi,
I believe it's underscore select as the key.
Let's double check that it's that.
It is, it's that.
And then again, the value of multi-select is the array,
and just to give you one little reminder here,
our types value is types array, which is already an array,
which means all we need to do is type Pokémon.types
right there, and that'll pass the array
as the value of this multi-select property.
Cool, so let's look at what else we have to pass.
We have bold URL, that's gonna be some body content.
We have sprite, and we have artwork,
and I believe that's everything that we're adding here.
So we're gonna save bold URL for a little bit later.
First, let's work with the sprite and the artwork.
So what we wanna do is set the artwork as the page cover,
and then we wanna set the sprite as the icon,
so going back to our official decks here,
or at least this reference piece here,
we can see that the sprite has been set as the icon here,
and then the official artwork has been set
as the page cover.
So let's start building that.
We can come back down here,
and I know that these things are defined
outside of the properties object.
They are their own objects,
and to find out how to format them,
well, once again, go over to our handy-dandy API reference,
and we're gonna go over
to the create a page reference page here.
And if we look at this little black box right here,
we can actually see how this is set up.
So within the data object, we have cover,
and that's its object, and then we have icon.
And if we want to pass an external image for icon
instead of emoji here,
we'll do this exact same thing here
with external URL, et cetera.
So first we'll do cover, and then we'll do icon.
We can just kind of copy and paste from that point.
I'll put this above properties.
We'll call it cover.
That'll be an object.
I'll add my trailing comma there.
And then the first thing is gonna be type external.
External is its own object
containing a property called URL,
and that is going to be,
going back up for our artwork, artwork.
So it should just be Pokemon.artwork.
And now, because the icon is very similar,
we can copy that, paste it,
add our trailing comma once again.
But in this case, we wanna say icon.
And instead of the icon being the official artwork,
we want it to be the sprite.
And remember, Pokemon.sprite
corresponds to our object definition,
which is being given a new variable name, Pokemon,
because of the loop.
But the property is sprite.
So the next thing we'll do is add some children
to this little page definition.
And to do that,
let's once again go back to this create page reference,
and let's see if it gives us a hint on how to do it.
So we have properties here.
We'll keep scrolling down.
And aha, here we go.
Children is yet another property
which contains an array of child blocks.
And then we have a definition for each kind of block
that we wanna create.
So let's get that going first, children.
We'll make sure that we put this
after our properties definition.
Yep, there we go.
Call this children.
And children is an array.
And then the array is gonna be filled with objects.
So I know we'll already start with curly braces here.
And when we want to add a block,
it's always going to have this first property.
It's gonna be object block.
And now to find the rest of the properties
that we wanna add in here,
we could look at this,
but what's gonna be way more useful
is to come into this block object page.
And this is gonna give us a definition
for every kind of block that we're able
to send to Notion via the API.
So this is a paragraph block.
Paragraph blocks can be very complicated
because you can define all their formatting.
You can define bolding, colors, all kinds of stuff.
But we want to look at something a lot simpler
to start with, which is going to be a bookmark block.
So boom, there it is, bookmark.
And all we need to do is specify the type is bookmark
and then pass a bookmark object with the URL.
That's pretty easy.
So let's do object block, type bookmark.
Bookmark again is an object itself
with a property of URL.
And the URL is, what is it?
Well, we can come back up here to our object definition
and we can see it's bulb URL.
So it'll be pokemon.bulbURL.
So now we have reconfigured the object
we're gonna send to Notion
for all the new data we've added.
And I think we have everything we need
to try another test run.
So let's once again,
look at the group of Pokemon we're gonna send.
It's gonna be 120 to 130.
Why don't we actually set that back to one and 10
and inside of our Notion template,
we'll go ahead and delete all of these records,
even Bulbasaur, we don't need him for now.
Before we run it,
we wanna come down here and uncomment
our create Notion page function call
because otherwise nothing will happen.
And if we want to,
we could also get rid of this console log
for process name and for bulb URL.
Those were just for testing.
And once we're done testing,
we can get those out of there
to stop polluting our console when we run things.
So let's go ahead and clear our console.
And once again, node index.js and see what happens.
So we're fetching, cool.
And we've got new pages coming in the Notion.
We can see their URLs right there.
And if we go back over to Notion, look at that.
We have got Pokemon.
We have got art.
We've got numbers.
And we're missing just a few different things.
So if we wanted to,
we could set the sprite inside of this
little sprite file attachment here.
I've decided that it's a lot nicer
just to use the page cover.
But look, we've got the page cover set
with the official art.
When we have the icon as the sprite data,
and we've got that for all of our Pokemon.
And I think if we drag this little side peek over
to be a little bit thinner,
we could see more of it.
I'm so zoomed in on this tutorial.
I can't drag it in much more than this.
But if you're not this zoomed in, you usually can.
And if you come down,
we have our Bulbapedia link.
And let's test a couple to see if they work.
So Charizard works perfectly.
And let's test Wartortle as well.
Coming on down, click that.
Boom, Wartortle, perfect.
So you will notice that we are missing
a few pieces of information here.
We're missing the category,
which would be things like,
I think it's like lizard Pokemon, flame Pokemon,
things like that.
We are missing the generation.
And we are missing one thing that I do wanna have,
which is the flavor text for the Pokemon.
Every Pokemon has flavor text.
If I come into my actual decks here
and scroll down, let's go to Butterfree.
We have got, in battle, it flaps its wings at high speed
to release highly toxic dust into the air.
Well, jokes on you, Butterfree.
I love highly toxic dust.
I wanna have this kind of stuff in my page as well.
So how can I do that?
Well, if we look back at the Poke API,
we will notice that at the Pokemon resource,
we don't have that information.
And that is because there is another Pokemon resource
called Pokemon-species.
And if we call that one,
we get an entirely different set of information.
For instance, we get a property called Genera.
And if we look at Genera, we can actually see,
if I come down to the English one,
barrier Pokemon.
That is what is called the category on Bulbapedia,
barrier Pokemon or dancing Pokemon.
Going back to the Pokemon API,
we also have flavor text in this response.
Flavor text entries right there.
And there are quite a lot of them,
many of them for different languages
and different versions of the game.
And finally, the generation is also inside
of this Pokemon-species endpoint.
So that means that we have to call this endpoint
and append the data that we get from it
into the object we've already created per Pokemon.
So how can we do that?
Well, once again,
we can utilize a handy-dandy loop for ourselves.
So after the first loop that we created right here,
this four-let I,
we're gonna make ourselves a brand new loop.
But this time we have an array to work with,
just like with the Notion call.
We had PokeArray.
That's now populated with elements.
We can use that once again to basically loop through
and call this new API endpoint at PokeAPI
using the ID or the number of the Pokemon
that we are interested in.
And we can do that for every Pokemon.
So we're gonna go four-let Pokemon of PokeArray.
Once again, we are gonna be feeding the object defined here
for each element in this array
into this temporary variable.
And that will allow us to work with it
inside of these little curly brackets here.
So we're gonna make another call to Axios
or to the Pokemon API via Axios.
Let's call this const flavor, maybe flavor town.
Nah, just flavor for now.
And once again, it's gonna be await Axios.get.
And what's the resource we're calling?
It's Pokemon-species.
So I'll just copy this right here,
pass that in there, get rid of Mr. Mime.
And we already know that we wanna convert
these single quotes to back ticks
to turn this into a template literal
where we can pass our dynamic value here.
And we can actually pass the number.
If I go back to the PokeAPI, what was Mr. Mime, 122?
Mr. Mime, there he is right there.
Hopefully you knew that, Tony.
122, Mr. Mime.
You may need that at some point in your life.
So template literal value, a variable.
We'll do a little dollar signs, our little curly braces,
and that's gonna be, what is it?
Pokemon.number.
And once again, we'll do a .then.
We'll bring in our variable as flavor,
do a little arrow function,
and define what we're gonna do
with the response we get in here.
So once again, this is an iterative development process.
We are learning bit by bit as we go.
And one piece of advice I can give you for development,
no matter what you're doing, is just run it at all times.
If you're ever confused, if you're like,
I don't understand this, this is overwhelming,
there's too much to do, just run it.
And then you're gonna get some feedback,
and then you can make a little bit of a change,
and you can run it again,
and you'll do that again and again and again,
and then one day you'll wake up and you'll go,
wait, I know way more than I ever did before.
So let's console.log flavor.
Let's comment out createNotionPage again,
just to make sure we're not sending
a bunch of bogus data to Notion,
and let's run our index one more time.
Bunch of stuff, bunch of stuff.
So we can tell that it is working,
but once again, it is a huge amount of data
that is not going to be that useful.
So just as we did with our original call
to that original Pokemon resource at PokeAPI,
we're gonna start defining down here,
defining an object that gets pieces of the response
and stores them.
But we don't actually wanna define a new object,
we wanna actually add to the previously defined object,
this PokeData, because that way,
we're just gonna be able to, once again,
call down here, Pokemon.let's just say genera
or flavor text or whatever it is.
So to do that, we are first gonna define some variables.
And to start that process,
I'm gonna make a const flavor town.
It's too tempting, but I'm gonna call it flavor text.
And that is going to be flavor.
And let's look back at our API response
to see what it needs to be.
We know that .data enwraps,
or I guess encapsulates all of this.
So it's gonna be .data, flavor text entries,
and then we are going to need to find
the particular flavor text entry that we want,
which is gonna be the one in English,
at least for my purposes, because I only speak English
and I guess JavaScript now.
So we're gonna have to do something kind of fancy here,
because we could be lazy and we could be like,
oh, well, this is right here at array index zero.
So we could just do flavor text entries.
Going back, we could do .data.flavorTextEntries zero.
Dot flavor text.
And that would give us the flavor text
in this particular instance.
But if you look at some other Pokemon,
you will find that their zero index
is in Korean or Japanese.
If I come up here and let's just do 780.
Now, if I go to the flavor text,
the first array indice here is actually in Japanese.
So that is not going to work for our purposes.
Instead, we need to do what is maybe
the most technical part of this tutorial.
But again, when we just simply break things down
and we take a little bit of time to study them,
it's not that crazy to learn how they work.
We need to do something called nested object destructuring,
because we need to search inside of the objects
contained within this array for a particular value.
And then using that search result,
we want to return a different value.
Essentially what we want to do is look inside
this flavor text entries array,
find the one that has this nested name value
of, I believe there's going to be EN somewhere.
So we have to go way down to find it in this case.
Yeah, it's seven EN.
And then we want to get the flavor text value
from that object in the array.
So let's go ahead and find that bit of code.
Here it is in my original code here.
So you can see once again,
we are actually passing it through
multiple different functions.
First we're doing dot find,
and then we're passing that result
and the flavor text property of that result
into another instance of replace.
So let's first grab just this piece
and we'll bring it over.
So we want to call this on the array itself.
And let's first look at the dot or the find method in MDN.
So find, and we can see the find method
returns the first element in the provided array
that satisfies the provided testing function.
So essentially we're going to go through the entire array
and we're going to define a piece of search criteria,
which is a function.
Here, we're looking for the first array element
that is greater than 10.
So go, nope, not five, 12, yep.
We're going to return 12.
And this is actually very useful
because we are returning the entire array element,
even if we are going to look deeper into this array
to do our search function here.
So to do that,
we have to do something called nested object destructuring.
And that is basically this little bit
of nastiness right here.
So instead of passing the entire array element
into the function,
and maybe we could actually do that,
but we're going to do it this way because it's fancier.
We are going to dig into that array
and we're going to get this name property,
which is itself a property of the nested language object.
So I could switch this up
and I could just use name right here.
And name would hold the entire array element
for each one in the array.
So going back here, that would be all of this junk.
But I actually just want to grab this.
So to do that, I can use what's called object destructuring.
And that is where we dig into the object
and we get the value of one of its properties.
So in that case, I could just do language here
and that would get the entirety of this language object here,
but I just want this name and I want to look for EN.
So we can take our destructured object
and we can do nested object destructuring.
Once again, it's the same as before.
Reviewing here, we are reaching in
to each element of the array, seven, six, five, all of them.
We're reaching into the language object
inside that array element
and we're grabbing this name property.
And then it is now in this name variable.
We're going to check that it's equal,
strictly equal to EN.
So it's going to return the first entire array element
that satisfies this test.
And then we're going to access the flavor text property
of that element.
Going back to the API, we have our array elements
and then we have the flavor text property inside of it.
So we want that, but if we log that as it is,
and let's go ahead and do that as a test.
So do, do, do, do, do, good to go there.
Console.log, flavor text.
If we do that, you're going to notice something annoying.
So clear.
We have a lot of new line characters.
I don't know why,
because when we look at the API response here,
we see it as one nice little string,
but for whatever reason,
it returns with a ton of new line characters
and we do not want that.
So we are going to pass the results of this
into yet another replace call.
If you recall, replace is going to look for
matches of a regular expression,
and then it's going to replace it with something new.
So we're going to do replace.
We're going to define a regular expression
and we want every single match of the expression
to be replaced with our little space character here.
So the way we can make sure that every match
of a regular expression is matched here and replaced
instead of just the first
is we can add a G after our final slash here.
This is just a flag or a regex modifier,
and that's going to tell the replace function,
hey, do this to every single match we find,
not just the first one.
And what are the matches you may ask?
Well, it's going to be new line characters
and the special character inside of regular expressions
for new lines is backslash N.
But we're going to be thorough
and we're going to also look for other ones
that could potentially be there.
So we can actually use this straight up
and down line right now.
I'm brain farting on what this is called,
but we can use it as like an or condition.
So we can find a slash N for a new line or a slash R
or, and I think I also threw in, yeah, slash F as well.
Just to be super thorough,
it's probably going to be slash N each time for new lines,
but we are being thorough with our code.
So once again, we are getting the first entry
or the first element from our flavor text entries array
that matches our search function here in find.
We are returning that accessing the flavor text object
inside of the returned element.
And we're passing that object through replace,
which is giving us a brand new string
and putting it into the value of flavor text.
So once again, if we log flavor text,
actually I want to clear this first,
get all that out of there.
Now we get nice single lines, perfect.
So at this point we can add our flavor text to our object.
And how do we do that?
Well, all we need to do is access the object.
And remember right now the object is Pokemon
because we're inside of this for loop.
And then we can define a new key for it.
So I'm going to use bracket notation
to do flavor dash text.
And I'll close that off.
And then I'll set that equal to flavor text.
And note that I could easily have done this equal to this.
So I'm kind of just taking two steps
to make this as clear as possible,
but I could make it more efficient and more compressed
if I broke this down to one step.
So we have our flavor text.
What else can we get from our Pokemon dash species endpoint?
Well, we can get what's called the genera
and that's going to be our category.
Like, let's see if we can find it.
Placid Pokemon right here.
And we can also get the generation.
So let's do the genera first.
The genera is going to be a very, very similar situation
where we need to search inside of this array
for the element that has the EN for English language name,
which means we can pretty much copy and paste,
except we don't need this final replace function here.
So we're going to go ahead and grab this
and we're going to do it one more time.
And we're going to change flavor text to category.
I'm using the Bulbapedia terms
instead of that genus term that they use.
But we now need to modify what we're accessing here.
So it's going to be flavor data genera.
And remember genera is the name of the array here.
So once again, we are going to be using that find method
and we're going to be looking once again for that EN.
And then we need to access, what do we need to access?
The genus property inside of the matching array element.
So coming back here, we want to change this to genus.
And if I am not incorrect,
it is already formatted the way we want.
Placid Pokemon, perfectly good.
So we don't need to do any sort of text massaging
on that one.
We can simply set Pokemon.category,
which will define a new property of the object to category.
Last but not least, let's get that generation.
So let's do const generation equals flavor.data.generation.
And let's check our API docs one more time.
Get out of this array, find generation.
And there it is.
Generation is just an object with name as the key we want.
So let's do generation.name.
We'll go ahead and log that just to show how it works.
Clear my terminal, please and thank you.
Run Node.js one more time.
And my glitch instance is getting a little bit slow.
There it goes, generation-1.
So the last thing we want to do,
if we go back over to our little Pokedex here,
is format our generations to look just like this.
I just want the Roman numeral from the end
and I want to set it to uppercase.
So let's look at our actual code here.
And once again, let's walk through what we're doing
in this line right here,
because we are passing flavor.generation,
or data.generation.name through three different functions.
So we'll grab this.
This will let us access the generation.
Actually, we've already done it up here.
So I didn't need to copy that.
And now we first want to split it.
So once again, we are splitting to get an array
and we're splitting on slash the dash right there.
We're going to pass that result,
which is going to be an array into a method called pop.
And pop, if we go over to our MDN, is not soda or Coke.
I don't know where you're living
and where you call it down there,
but it's a method that removes the last element from an array
and returns that element.
And we know that if we are splitting on the dash,
we're going to get generation as the first element
and then one or two or three or whatever
as the final element.
We want to get that last element.
So we can use pop to get it.
And then we are going to throw the popped element
into two uppercase,
which is a method that I think
you can probably guess what it does.
And then finally, we're going to go pokemon.generation
equals generation.
And just for good measure,
I'm going to add one more console log step.
So when we're running through this in a giant loop,
we also get a little bit of confirmation
that we've fetched the flavor information for each Pokemon.
So let's set this and let's actually grab the name.
So we do pokemon.name as a variable in there.
And with that, we are done getting all of this flavor,
category and generation information
from the Pokemon species endpoint at Poke API.
The last thing we need to do before we're done
and we can run this bad boy for all the Pokemon
and set off all the fireworks
is send the new information we've just fetched to Notion.
So once again, we have to start to modify this object
that we are sending to Notion to handle the new data.
So let's take a look at the three different object
properties that we've created here.
We have flavor text,
that is going to be an actual paragraph
that we're going to put on the page body.
The category is a text field,
but it's an actual text property in the database.
And the generation is a select property.
We can go back here and we can reference these.
So generation is a select property,
category is a text property, but it is a database property.
And then the flavor text simply goes on the page body.
And I've actually formatted it as a block quote.
And I just think that looks kind of nice.
So let's start building this
and we'll start with our select block
because that's going to be a bit easier.
So going back over to the Notion API reference,
I'm going to go to the page object
and property values page here,
and I'm going to look for select property values.
And we can see how this kind of object is constructed.
So once again, we are going to be zooming in.
So you can see this better.
We're going to look for the name of the property
and then we're going to pass it an object called select,
which contains an object with a name property, cool.
So our value, our name here is generation, just like that,
which means we can add ourself yet another property here
and I'll just add it beneath type.
So let's go generation, add our trailing comma.
That's going to be an object called select,
which itself contains one called name
and name will be Pokemon.generation.
The next one is going to be our text field.
So that one will be called category
and let's see how we define a text property.
So go back to our property values,
zoom out to get my table of contents
and find a rich text property values subheading here.
It's not title, that's the actual key value of the database,
the name property, it's rich text here.
And you can see, you can do a lot with rich text,
but to break it down, we're going to pass the name.
It's again, zooming in.
We're going to pass the name of the property
that is going to contain an object with a rich text array.
And then this is really the rest
that we need to look at here.
That array contains elements,
each of which are objects with type text
and then a text object.
So let's see if I can build that for memory.
I probably can't, but we're going to go ahead
and try it anyway.
So category is the name.
And then I already forgot.
Haven't done this enough times to truly remember it.
And then that is going to contain an array of objects
where we have type, text,
and text is going to contain an object
with a property called content.
And the property,
the content property is going to be Pokemon.category.
If I could spell correctly,
let's check that.
Oh, and let's add our trailing comma before we forget.
So the last thing we need to do,
and I think this is truly the last thing we need to do
is append our flavor text in our children array.
So remember from before we added one child block,
which is our bookmark to the Bulbapedia website.
Well, above that,
I actually want to create another paragraph object.
So once again, back to our handy dandy reference,
we're going to go zoom out.
We're going to get to our block object page,
and we're going to look at how paragraph blocks
are constructed.
And you will notice that it's very similar
to the rich text object we just created
in the category property.
We have paragraph, we have type paragraph.
These aren't named properties, so it's just paragraph.
And then it's basically the same,
except for I could put links in there if I wanted to.
So once again, testing my own memory,
let's see if I can build this from scratch.
Let's do, all right, object, block, type paragraph.
Paragraph is just like the other thing
that I can't think of right now,
but it does have that rich text array.
And inside we have array of objects,
we have type text and text is an object with content.
Fingers are flying here.
And the content is going to be Pokemon dot,
or not dot because we have to access this
with bracket notation, flavor text.
And I would like to put a space or a blank line
between our flavor text and our object.
And it just occurred to me that I did not want
my flavor text to be a paragraph,
I wanted to be a block code.
So actually I'm going to pass a blank line
as a paragraph block.
And above that, I'm going to add our flavor text
as a block code object.
So let's go back to the block reference here.
Let's find block quote or quote,
see what it's called, quote blocks.
And we can see that it is exactly the same
as our paragraph blocks, except for type is quote,
and then we put quote there.
So come back here, that means we can actually
just copy this, copying and pasting
is every developer's best friend.
And we can change this type to quote,
we can change this object's key to quote,
and then here we'll pass our Pokemon bracket flavor text.
And that should be it, my friends.
So the moment of truth has now arrived.
We can come and uncomment our create notion page
function call here.
And let's go ahead and set this to,
let's get a little bit feisty here to 25.
We're going to pull 25 Pokemon at once.
So I want to first clear my little template demo here
of all Pokemon that we've brought in so far.
And I'm feeling confident.
I think we've set the generation correctly.
So I'm going to go ahead and hide no generation
and I'm going to expect that everything we pull
is going to come into generation one right here.
If it doesn't work, then I owe you nothing
because I'm not in the habit of doing weird bets
with my audience when they can't talk to me synchronously.
But I do think we are ready to actually do this.
So drum roll please, we'll clear our terminal.
We will run this and we'll see what happens.
Fetched information from PokeAPI, good.
Fetched flavor information, good.
And we've got pages coming in.
So let's hop over to Notion
and watch the fireworks.
Look at that, perfectly come in with their generations,
with their types, with their categories.
Let's open up a random one.
Do we have our flavor text?
Yes, we do.
We have our space here.
We have our Bulbapedia link testing that, it works.
And we have just created
a complete Pokedex generation script,
which allows us to create a full Pokedex inside of Notion
with absolutely no manual data entry whatsoever.
And hopefully you've also learned tricks
for actually using these APIs.
Why don't we go ahead and start bumping this up here?
So we've got 25, let's do 26 here
and we'll go ahead and set this to 500.
And we'll just let these results populate
as I round out this video here.
So index.js, we're fetching all kinds of Pokemon here.
And you can see it takes a bunch of requests
and then it kind of makes it wait for a couple of seconds.
So you have like this sort of wavy thing going on here,
but we are getting all of these Pokemon,
which is pretty sweet.
So once we start getting Notion page responses,
I'll hop over back to Notion
and we can watch things start to come in.
But you have now completed this tutorial.
I will have the code for this
in the blog post linked down below.
I will have my glitch instance.
So you can actually, once again, remix the project
if you wanna study it,
if you wanna mess around with it, you can do that.
Or you can build things from scratch.
If you've just been watching this
eating popcorn the whole time,
maybe rewind and build things from scratch
because this I think is a great project
for learning how to interface with APIs.
I learned so much from this.
And I have also learned that the Poke API
is a wonderful API to play with
if you wanna start learning how to both play with APIs,
but also learn how to code,
learn how to manipulate data.
We did a lot in this tutorial
to manipulate and massage the data that we got,
the raw data that we got from Poke API
to make sure that it's exactly what Notion needs
and that it looks pretty and nicely formatted,
which is pretty sweet.
And yeah, hopefully this has sort of
stimulated a bunch of ideas for you.
There are like chart libraries
so you could start embedding charts of their stats
in the body description.
We didn't even get into how to access relations
from the Notion API.
So you could actually do like evolution chains
if you wanted to.
There's a lot we could do in the future.
So if you liked this tutorial,
let me know in the comments,
share it with your friends,
you know, share it on Reddit or whatever you wanna do.
Give me signals that this is kind of the kind of stuff
that you'd like to see
because this does take a very long time to do.
It is very fun, but it is kind of technical content
and it feels a little bit experimental
compared to like the normal straight up
vanilla Notion tutorials that we do.
That being said, I do envision a future
where the Thomas Frank explains channel
has multiple playlists on the homepage
where there's like the basic stuff, the build guides,
but then people can go down
and find the section on API tutorials.
And look at that, we have all of these Pokemon coming in.
We've got all of their height, their weight.
And one cool thing that I will note
is that the height and weight values returned
by the Poke API are actually in decimeters and decagrams,
which I guess was good for the games
in like floating point values or whatever back in the day,
but I've actually created little formulas
that will translate them to kilograms and meters.
And then if you go into a Pokemon,
there are additional formulas for us Americans
that wanna do things with feet and inches
and that kind of thing.
So yeah, if you have questions,
let me know in the comments down below.
I will note that for this tutorial,
I probably can't guarantee a lot of technical support,
number one, because I am not a JavaScript developer.
Everything you heard me talk about in this video
is the result of me starting my JavaScript journey
in June of this year.
So there's a lot of stuff that I actually don't know.
I've just sort of like sprinted ahead
for certain things like this here,
and I was able to get this working.
But hopefully with the highly commented code
here in the glitch instance,
I've commented literally every single line of code
and explain what's happening.
Hopefully with that, along with the video
that I've just shot right here,
and then all the references and resources
I'm gonna share with you below in the description,
as well as in the markdown document right here,
hopefully you're gonna have everything you need
to learn how to build this
and then how to extend it into the future.
Hopefully you enjoyed this tutorial.
Thank you so much for watching.
If you haven't already,
you can go over to thomasjfrank.com slash fundamentals.
That is currently the only place on my site
that I have set up to sign up for my Notion newsletter
that's easy to share.
So even if you're like super pro with Notion,
you don't need all the fundamental stuff,
that's how you can get on my Notion tips newsletter
where I first let you know,
first and foremost about tutorials like this,
when they drop, you'll be the first to know.
And secondly, anything like extra cool
that I wanna share specifically with my email newsletter
or give beta access to templates that I'm developing
before they go live to the public,
people on my newsletter are gonna be the first ones
to know about that.
So definitely get on the Notion tips newsletter
if you haven't already.
Check out my templates.
I've got Ultimate Brain,
which is the complete and ultimate productivity system
for Notion.
If you want tasks and projects and notes in the same place
in one, all in one dashboard,
Ultimate Brain is the way to do it.
And then I've got Creators Companion,
which is great for content creators.
And at the top of each of those pages,
you will see a discount code that is temporarily available.
You can use those.
I'm offering discounts and check those out
because what you will be able to do
if you start learning a bit more about the API
is extend those templates
to do pretty much anything you want.
See my previous tutorial for bringing YouTube stats
into a template like Creators Companion.
So you can see your views, your likes, and your comments.
This Pokedex project, while super fun,
is I think just an introduction
to the world of coding and APIs.
And there's so much more you can do
and you can do actual useful things for your life
and your business using these tools.
Last but not least, I don't promote this enough.
It's totally free, but I haven't promoted it enough yet.
If you are one of those people
who wants to start writing formulas in Notion,
taking your database skills to the next level,
doing things like, say, converting meters and kilograms
to inches and feet, just like this right here.
If you wanna understand what the heck is going on
in this code block right here,
I wrote an entire technical reference for Notion formulas.
It has an article for every single operator,
constant, and function that Notion's formula editor
has as of today, which includes the syntax,
it includes example formulas,
it includes an example database that you can duplicate,
it includes explained code for the examples.
Literally everything that I could think to document
about Notion formulas has been documented.
So check that out over at notionformulareference.com,
also linked in the description down below.
And I have been talking for like three hours at this point.
So thank you again for watching.
Like this video if you enjoyed it.
There's no dislike button anymore, so sorry about that.
Leave me a nasty comment if you didn't enjoy it, I guess.
Let me know what you would improve about this.
I'm always looking to improve my own knowledge,
my own skills.
I know for a fact that there's stuff in this code
that it could be a lot better, but it is working.
So it's at least a Rube Goldberg machine at this point.
Let me know what I could do in the future.
I would love to know if there's any tips and tricks
that you have off the top of your head.
Follow me on Twitter, TomFrankly, and ask questions there.
And I will see you in the next one.
♪ Hey, hey, hey, hey, hey, hey, hey, hey, hey, hey, hey ♪
