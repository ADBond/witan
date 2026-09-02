# TODOs

## Game aspects

* ~~Stop penalties~~
* ~~Down-card score~~
* ~~Proper starting board~~
* ~~End the game~~
* 4p version
* Play high-low on 12

## Features

* Some score details
* ~~Previous trick (+ trump suit!)~~
* ~~Colour score table to match player chips~~
* Nicer display trickpile scores
* Sort hand more sensibly
    * Not sure what this will be -  maybe reordering constantly would be annoying? maybe fix to the starting hierarchy

## Bugs

* ~~should not wraparound when ranks fixed - e.g. running A -> 2, if a suit has a face-down K, playing the A should not be face up just because we have the 2~~
    * ~~Top rank can get pushed to the top when it's already the bottom~~
* Still get some kind of 'push over the top' when it leapfrogs during a trick. So something like: grid is near saturated 2 -> K, then trick is King, 2, Ace - the Ace glues them together and catapults the 2 to the top (potentially orphaning other suits). At least, I think that was what happened. 
