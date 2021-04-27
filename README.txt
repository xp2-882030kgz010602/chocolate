A search program for finding (m,n)c/m frontends in alternating rules.

Explanation of config.json:

period: The period of the frontend
ruleperiod: The period of the rule. For example, a (4,1)c/4 with only 2 alternating rules:

x = 13, y = 9, rule = B2aci3cer4jy5e/S1e2ae3n4aknrw5r|B13inr5k/S1e2ae4z
2o2b3o2bob2o$bo8b2o$10bo$o11bo$7bo$11bo$8bo$bo5bo$3bo2bo!

horizontal: The horizontal displacement of the frontend.

width: If the width is n, the first n cells and the last n cells will be preserved after <period> generations.

step: How often the program will print something like 16384/262144.

stepfactor: The factor that the program increases step by when increasing the width.

To use, just run:

node proof1.js

This will find partial frontends with the specified parameter. It will then create the possible extensions of each frontend and increase the width. Run again to increase the width again, and so on. It saves partial frontends and rules where they work, to speed up the search after bumping up the width. You do not need to run extend.js because proof1.js runs it automatically for you.

check1.js is used to make a list of complete frontends.
