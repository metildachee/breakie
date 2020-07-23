# breakie - made with love, from next door

breakie is a web based application that builds communities through sharing breakfasts.

## Why breakie?
The new generation of workers rarely eat breakfast, especially during the rush hours. On the other hand, many cooking enthusiasts often make piping hot breakfast, but can't finish it alone; and everything goes to waste. What if there was a way to close the gap? What if, the busy bee could literally, go next door to collect freshly made breakfast, with a minimal fee.

Sharing is caring! Exchange homemade breakfast with your neighbours and interact with the community at the same time! The main purpose of this project is to increase community spirits and interaction.

# Who should use Breakie? 
Who is Breakie's target audience?
| Busy bees     | Cooking enthusiasts |
| ----------- | ----------- |
| Convenient  | Meaningful |
| Delicious   | Minimal wastage |
| Cheap       | Earn ingredient cost |
| Know your neighbours | Know your neighbours  |

# How does it work?
Busy bees can visit the site to see what's cooking near them.
Cooking enthusiasts can visit the site to share what they're cooking for the day.

# Wireframes
<img src="https://raw.githubusercontent.com/metildachee/breakie/master/public/img/homepage.jpg?token=APQA23UWSJNPAIXXXQZ33FK7ELPNW">

<img src="https://github.com/metildachee/breakie/blob/master/public/img/orders.png?raw=true">

<img src="https://raw.githubusercontent.com/metildachee/breakie/master/public/img/card.png?token=APQA23SSHUUGI27BOTWUDPC7ELPPE">

Please see <a href="https://www.figma.com/file/v3kEtgMjBub29EzJlEfG8N/combined" target="_blank">here</a> for full wireframe.

# Technologies used
## Front-end
### HTML, CSS, Javascript

## Backend
### Node.js, Express.js
### Multer
### MongoDB, mongoose
### socket.io
For chatting between busy bees and cook enthusiasts.

<img src="public/img/chat.gif">

### APIs
#### Google Maps
Used for geocoding, distance matrix, map visualisation.

Breakies are displayed in increasing travel time from user's address. When hovered, the map markers highlights the associated breakies. When clicked, a window appears with the breakies of that cook enthusiast. This can be helpful for busy bees who might be more interested in travel time than dishes.

<img src="public/img/maps.gif">

#### Stripe Checkout
Used for payment.

#### [Algolia](https://www.algolia.com/doc/guides/building-search-ui/resources/ui-and-ux-patterns/in-depth/autocomplete/js/)
Used for real-time autocomplete and database search.
<img src="public/img/search.gif">

## Things that I tried but didn't work
1. [Pusher](https://pusher.com/)
2. [Stripe Connect](https://stripe.com/en-sg/connect)