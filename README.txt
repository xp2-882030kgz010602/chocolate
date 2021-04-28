A search program for finding (m,n)c/m frontends in alternating rules.

Explanation of config.json:

period: The period of the frontend. Search time increases drastically with the period-I'd say that it's roughly a 128-fold increase every time you increase m by 1. This is because 4 times as many patterns need to be tested to ensure independence of sides, and each increase in period adds another rule to the list of alternating rules. However, there are 32 symmetric 1D rules, and 32*4=128. :(

Note that the program automatically dedupes cycles to avoid running patterns in the same ruleset twice. I mean things like running in rules a|b and in rules b|a. This complicates time estimation.

(5,1)c/5 currently takes around 48 seconds per pattern at width 1 on this computer. A possible remedy for this would be to test left and right sides independently and see which rules can support both. This would mean testing only about 2^(m+n)+2^(m-n) instead of 2^(2m)=4^m patterns (the actual numbers are proportional to this). For slow speeds, this is a bit helpful, approximately reducing the factor of 128 to 64, as the number of patterns needed now only doubles instead of quadrupling. For fast speeds, not so much, since as n approaches m, we approach 4^m anyways. But fast speeds have their own speedup-if B1c doesn't appear at least n times, then the rule can't possible support (m,n)c/m frontends.

One might try running the frontend to an insane width, seeing which rules still can support one, then using that for speeding up the search for the backend. However, the factor of 32 is non-negotiable, period. My best guess is that (5,1)c/5 would take around 12 hours now, but this change would bump it down to around 45 minutes (4^5 vs. 2^6+2^4). (6,1)c/6 would be reduced from around 2 months to 2 days. Unfortunately, (7,1)c/7 is going to still be a problem. Ugh.

Using the frontend data to eliminate rulesets early on MAY reduce higher periods to searchable levels (good luck not getting a power outage for 2 months), but that's a factor that I can't calculate. All I can do is to thry to implement this change, run the searches, and get some hard data on this.

That being said, there's still not much that I can do about the sheer number of rules involved in high values of m.

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
