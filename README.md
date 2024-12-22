# TDS 2024 Sep Project 2 Results

These are the results of the evaluation of the [IITM Tools in Data Science Sep 2024 Project 2](https://github.com/sanand0/tools-in-data-science-public/blob/tds-2024-t3/project-2-automated-analysis.md).

This is the [evaluation process](https://github.com/sanand0/tools-in-data-science-public/tree/tds-2024-t3/project2).

[View the results](https://sanand0.github.io/tds-2024-sep-project-2-results/).

## FAQ

1. But I get different results locally. **ANS**: Your code ran differently in the test environment. LLMs and environments are not deterministic. Write code more robustly.
2. What's `fatal: could not read Username for 'https://github.com': terminal prompts disabled`? **ANS**: Your repo is private.
3. What's `missing autolysis.py`? **ANS**: Your script was not named `autolysis.py` and present in the root folder. Maybe it had a different name or was in a different folder.
4. Why's my README.md or \*.png missing? **ANS**: Your script didn't generate them, or saved them in a wrong location.
5. Why do `output: wage_theft.csv`, `output: house_rent.csv` get 0 points? **ANS**: They are not part of the evaluation. They're just an informational check.
6. What is `code_hacking`? **ANS**: The code has content that nudges the LLM towards higher code quality scores? This does not affect your score, but re-runs the evaluation.
7. What is `output_hacking`? **ANS**: The output has content that nudges the LLM towards higher output quality scores. That gives you a _tiny_ bonus and re-runs the evaluation.
8. Why does it praise my score and still give me 0? **ANS**: The prompt instructs it to always tell you what's good AND bad, irrespective of the score.

## Next steps

- Bonus marks will be added, hopefully by Mon 23 Dec 2024.
- Final marks be calculated. Maybe as `20% * score / max(score)`, but @jk will decide.

Analyzing the [results.csv](https://sanand0.github.io/tds-2024-sep-project-2-results/results.csv) will be interesting. Please do share your analysis and learnings.
