#!/usr/bin/env python3
"""Builds /careers/ and one page per open internship from OPENINGS below.

The owner asked on 22 November 2026 for real, paid internships for Americans,
in English, localised in New York. Terms he chose: $20 an hour, 20 hours a
week, January to June 2027, remote, engaged as independent contractors and
paid through Deel. Every page carries a JobPosting (Google's job results) whose
description is the text shown on the page, nothing more.

Rules (Google's job-posting guidelines, and the site's):
- an opening is real and staffed; when it is filled or the deadline passes,
  remove it from OPENINGS, re-run, and add a 301 from its URL to /careers/
  in _redirects, so no expired JobPosting stays online;
- the hub lists the openings and carries no JobPosting;
- pay, hours, dates and location are the owner's; never change them here
  without his word;
- no ad code on these pages.

    python3 scripts/careers/build-careers.py           # writes the pages
    python3 scripts/careers/build-careers.py --check   # fails if a page is stale
"""
import html, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SITE = 'https://statedoku.com'
POSTED = '2026-11-22'
DEADLINE = '2026-12-20'                    # last day to apply, New York time
VALID_THROUGH = DEADLINE + 'T23:59:00-05:00'
EMAIL = 'contact@statedoku.com'

TERMS = [
    ('Pay', '$20 per hour, about $1,730 a month at 20 hours a week, paid monthly through Deel'),
    ('Hours', '20 hours a week, on your own schedule, plus one video call a week'),
    ('Dates', 'January to June 2027 (six months)'),
    ('Location', 'Fully remote, for candidates living in New York State'),
    ('Status', 'Paid internship, as an independent contractor'),
    ('Apply by', 'December 20, 2026'),
]

ABOUT_SD = ('Statedoku is a free daily geography puzzle about the 50 US states: a 3 by 3 grid where '
            'each state must match a row clue and a column clue. The site also has 21 mini-games and '
            'about 180 articles in English, French and Spanish, and posts a short video every day on '
            'TikTok, YouTube and X. It is built by one developer, the founder, who works from France, '
            'six hours ahead of New York. Its players are puzzle fans, students and teachers, many of '
            'them in the United States.')

COMMON_PROFILE = [
    'You are a college student, undergraduate or graduate, or you graduated in 2025 or 2026.',
    'You live in New York State and are authorized to work in the United States.',
    'You write clear English and you finish what you start without being chased.',
    'You like maps, geography or puzzles. You do not need to know every state capital.',
]

HOW_YOU_WORK = [
    'The job is fully remote. You work 20 hours a week, when it suits you.',
    'You meet the founder on one video call a week, in the New York morning, and write a short note every Friday on what you did.',
    'You are engaged as an independent contractor and paid $20 an hour each month through Deel, a payroll platform. Deel handles the contract and the payments.',
]

PROCESS = [
    f'Email {EMAIL} by December 20, 2026, with the subject line given below, your résumé as a PDF, and five lines answering the question below.',
    'If your profile fits, a 30-minute video call with the founder before the end of December.',
    'A short task linked to the role, one hour at most.',
    'An answer within a week of the call, and a start in January 2027.',
]

OPENINGS = [
    {
        'slug': 'business-development-intern',
        'title': 'Business Development Intern',
        'meta': 'Paid remote business development internship in New York with Statedoku, a daily geography puzzle: $20 an hour, 20 hours a week, January to June 2027.',
        'lead': 'Find the partners who will put Statedoku in front of new players: education publishers, newsletters, puzzle sites, libraries and museums.',
        'missions': [
            ('Build the list', 'Find organizations that could feature or sponsor the daily puzzle: education publishers, newsletters, puzzle and trivia sites, game portals, libraries, museums.'),
            ('Reach out', 'Write and send personal emails, follow up, and book calls with the right people.'),
            ('Prepare offers', 'With the founder, draft partnership proposals: a sponsored puzzle, a co-branded quiz, a version for a classroom platform.'),
            ('Keep the pipeline', 'Track every contact in a shared spreadsheet and report each week on what moved and what did not.'),
            ('Study the market', 'Map the other geography games and learning tools, what they charge and who uses them.'),
        ],
        'profile': ['You study business, marketing, communications or a related field.',
                    'You are at ease writing to people you do not know, and you take a no without taking it personally.'],
        'learn': 'How a small live product finds partners, from the first cold email to a signed deal, and how to measure which approach works.',
        'prompt': 'Name one organization that should feature Statedoku, and say how you would approach it.',
    },
    {
        'slug': 'education-partnerships-intern',
        'title': 'Education Partnerships Intern',
        'meta': 'Paid remote education partnerships internship in New York with Statedoku: bring a free geography puzzle to teachers. $20 an hour, January to June 2027.',
        'lead': 'Bring Statedoku to teachers, schools, libraries and homeschool groups as a free way to learn the 50 states.',
        'missions': [
            ('Reach educators', 'Contact social studies and geography teachers, school librarians, homeschool groups and geography clubs, and present Statedoku as a free classroom resource.'),
            ('Build a teacher kit', 'With the founder, write a short kit: lesson ideas that use the daily puzzle and the mini-games, and how to share them with a class.'),
            ('Listen', 'Collect what teachers and students say, and turn it into clear requests for the game and the articles.'),
            ('Join the communities', 'Take part in online teacher communities and events, and keep a list of the ones worth our time.'),
        ],
        'profile': ['You study education, geography, history, social studies or a related field.',
                    'Teaching, tutoring or camp experience is a plus.'],
        'learn': 'How schools and teachers choose the tools they use, and how to get a free educational product adopted in classrooms.',
        'prompt': 'Tell us how a teacher you know could use Statedoku with a class.',
    },
    {
        'slug': 'marketing-growth-intern',
        'title': 'Marketing and Growth Intern',
        'meta': 'Paid remote marketing internship in New York with Statedoku, a daily US geography puzzle: social video, press and SEO. $20 an hour, January to June 2027.',
        'lead': 'Help more people find the daily puzzle: short videos, social posts, press and search.',
        'missions': [
            ('Social and video', 'Plan and write posts for TikTok, YouTube Shorts, X and Reddit, where Statedoku already posts a video a day, and suggest new formats.'),
            ('Press', 'Find journalists, bloggers and newsletters who write about geography, puzzles and education, and pitch them stories.'),
            ('Search', 'Research what people search about the 50 states and help improve the articles that answer it. Every fact is checked against a source before it goes online.'),
            ('Measure', 'Read the site and social statistics each week and say what brought players and what did not.'),
        ],
        'profile': ['You study marketing, communications, journalism or a related field.',
                    'You know how TikTok and YouTube Shorts work from the inside, and you write short, clear copy.'],
        'learn': 'How a small site grows without an ad budget, and how to test an idea in a week and keep only what works.',
        'prompt': 'Send one idea for a short video or post about US geography, with the first line you would write.',
    },
    {
        'slug': 'web-developer-intern',
        'title': 'Web Developer Intern',
        'meta': 'Paid remote web developer internship in New York with Statedoku: JavaScript, HTML and CSS on a daily puzzle and 21 games. $20 an hour, January to June 2027.',
        'lead': 'Work on the code of the daily puzzle and the 21 mini-games, played on phones, tablets and school computers.',
        'missions': [
            ('Maintain', 'Fix bugs reported by players, keep the games fast on phones and school computers, and keep them usable with a keyboard.'),
            ('Build', 'With the founder, add features and new mini-games in plain JavaScript, HTML and CSS.'),
            ('Test', 'Write tests for the puzzle and the games, and run the site checks before each release.'),
            ('Ship', 'The site is static, hosted on Cloudflare Pages with a few Pages Functions, and deployed from git. You will review and ship your own changes.'),
        ],
        'profile': ['You study computer science or a related field, or you taught yourself and can show your code.',
                    'You write JavaScript and use git. Python is a plus.'],
        'learn': 'How a live product used every day is built, tested and released, and how to keep a codebase simple.',
        'prompt': 'Link to code you wrote (GitHub or similar) and tell us about one bug you fixed.',
    },
]

E = html.escape


def ga_block():
    """The consent-gated GA snippet every page carries, read from the About page."""
    s = open(os.path.join(ROOT, 'about', 'index.html'), encoding='utf-8').read()
    m = re.search(r'  <script>\n    window\.dataLayer.*?</script>\n', s, re.S)
    if not m:
        sys.exit('GA block not found in about/index.html')
    return m.group(0)


FOOTER = open(os.path.join(ROOT, 'learn', '13-colonies', 'index.html'), encoding='utf-8').read()
FOOTER = re.search(r'<footer>.*?</footer>', FOOTER, re.S).group(0)

STYLE = """  <style>
    .job-lead { font-size: 1.08rem; color: var(--text-2, #334155); line-height: 1.55; }
    .job-terms { width: 100%; border-collapse: collapse; margin: 14px 0 22px; font-size: .95rem; }
    .job-terms th { text-align: left; font-weight: 700; color: var(--navy, #0F2147); padding: 8px 12px 8px 0; vertical-align: top; white-space: nowrap; border-bottom: 1px solid var(--border, #E2E8F0); }
    .job-terms td { padding: 8px 0; border-bottom: 1px solid var(--border, #E2E8F0); }
    .job-list { list-style: none; padding: 0; margin: 16px 0; }
    .job-list li { border: 2px solid var(--border, #E2E8F0); border-radius: 12px; padding: 14px 16px; margin: 0 0 10px; background: #fff; }
    .job-list a { font-weight: 800; color: var(--navy, #0F2147); font-size: 1.05rem; text-decoration: none; }
    .job-list p { margin: 6px 0 0; }
    .job-apply { background: #fff; border: 2px solid var(--navy, #0F2147); border-radius: 12px; padding: 14px 16px; margin: 18px 0; }
  </style>
"""


def head(title, desc, path, extra_ld):
    url = SITE + path
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <!-- Google tag (gtag.js) -->
{ga_block()}
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#FFFFFF">
  <meta name="color-scheme" content="light">

  <title>{E(title)}</title>
  <meta name="description" content="{E(desc)}">
  <meta name="robots" content="index, follow, max-image-preview:large">

  <link rel="canonical" href="{url}">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=5">
  <link rel="stylesheet" href="/css/style.css?v=37">

  <meta property="og:type" content="website">
  <meta property="og:title" content="{E(title)}">
  <meta property="og:description" content="{E(desc)}">
  <meta property="og:url" content="{url}">
  <meta property="og:image" content="{SITE}/og-image.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{E(title)}">
  <meta name="twitter:description" content="{E(desc)}">
  <meta name="twitter:image" content="{SITE}/og-image.png">

{STYLE}{extra_ld}</head>
<body class="legal-body">

<header>
  <a href="/" class="logo">State<em>doku</em></a>
  <nav class="nav-actions"><a href="/careers/" style="color:var(--text-2);text-decoration:none;font-weight:700;font-size:.88rem;">Careers</a></nav>
</header>

<main class="legal-main">
  <article class="legal-page">
"""


def tail():
    return f"""  </article>
</main>

{FOOTER}

<script src="/config.js?v=17"></script>
</body>
</html>
"""


def ld(obj):
    return ('  <script type="application/ld+json">'
            + json.dumps(obj, ensure_ascii=False).replace('</', '<\\/')
            + '</script>\n')


def crumbs(items):
    return ld({'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': [
        {'@type': 'ListItem', 'position': i + 1, 'name': n, 'item': SITE + p} for i, (n, p) in enumerate(items)]})


def terms_table():
    rows = ''.join(f'<tr><th scope="row">{E(k)}</th><td>{E(v)}</td></tr>' for k, v in TERMS)
    return f'<table class="job-terms">{rows}</table>'


def job_body(o):
    """The posting's text: shown on the page and, word for word, in the JobPosting description."""
    parts = [f'<p class="job-lead">{E(o["lead"])}</p>',
             '<p>This is a paid, fully remote internship for students and recent graduates living in New York State.</p>',
             terms_table(),
             '<h2>About Statedoku</h2>', f'<p>{E(ABOUT_SD)}</p>',
             '<h2>What you will do</h2>', '<ul>']
    parts += [f'<li><strong>{E(t)}.</strong> {E(d)}</li>' for t, d in o['missions']]
    parts += ['</ul>', '<h2>Who we are looking for</h2>', '<ul>']
    parts += [f'<li>{E(x)}</li>' for x in o['profile'] + COMMON_PROFILE]
    parts += ['</ul>', '<h2>How you will work</h2>', '<ul>']
    parts += [f'<li>{E(x)}</li>' for x in HOW_YOU_WORK]
    parts += ['</ul>', '<h2>What you will learn</h2>', f'<p>{E(o["learn"])}</p>',
              '<h2>How to apply</h2>', '<ol>']
    parts += [f'<li>{E(x)}</li>' for x in PROCESS]
    parts += ['</ol>']
    return '\n    '.join(parts)


def apply_box(o):
    subject = f'Application: {o["title"]}'
    mail = f'mailto:{EMAIL}?subject=' + subject.replace(' ', '%20').replace(':', '%3A')
    return (f'<div class="job-apply"><p><strong>Subject line:</strong> {E(subject)}</p>'
            f'<p><strong>Your five lines:</strong> {E(o["prompt"])}</p>'
            f'<p><a href="{E(mail)}">Apply by email to {EMAIL}</a></p></div>\n'
            '    <p>We welcome applicants of every background. We never ask for a photo, an age or a date of birth. '
            'Your application is used only to assess it and is deleted within three months after the internships are filled, '
            'unless you agree that we keep it for a future opening, two years at most. See the <a href="/privacy/">privacy policy</a>.</p>')


def job_page(o):
    path = f'/careers/{o["slug"]}/'
    body = job_body(o)
    posting = {
        '@context': 'https://schema.org/', '@type': 'JobPosting',
        'title': o['title'],
        'description': body,
        'datePosted': POSTED,
        'validThrough': VALID_THROUGH,
        'employmentType': ['INTERN', 'PART_TIME', 'CONTRACTOR'],
        'hiringOrganization': {'@type': 'Organization', 'name': 'Statedoku', 'sameAs': SITE + '/',
                               'logo': SITE + '/logo-mark-192.png'},
        'jobLocationType': 'TELECOMMUTE',
        'applicantLocationRequirements': {'@type': 'State', 'name': 'New York'},
        'baseSalary': {'@type': 'MonetaryAmount', 'currency': 'USD',
                       'value': {'@type': 'QuantitativeValue', 'value': 20, 'unitText': 'HOUR'}},
        'workHours': '20 hours per week',
        'directApply': False,
    }
    title = f'{o["title"]}, paid remote internship in New York | Statedoku'
    out = head(title, o['meta'], path,
               ld(posting) + crumbs([('Home', '/'), ('Careers', '/careers/'), (o['title'], path)]))
    out += (f'    <p class="legal-meta"><a href="/careers/">Careers</a></p>\n'
            f'    <h1>{E(o["title"])}</h1>\n    {body}\n    {apply_box(o)}\n'
            '    <p class="legal-back"><a href="/careers/">All open internships</a></p>\n')
    return path, out + tail()


def hub_page():
    path = '/careers/'
    title = 'Careers at Statedoku: paid remote internships in New York'
    n = {1: 'one paid remote intern', 2: 'two paid remote interns', 3: 'three paid remote interns',
         4: 'four paid remote interns', 5: 'five paid remote interns'}.get(len(OPENINGS))
    desc = (f'Statedoku, a free daily US geography puzzle, is hiring {n} in New York State '
            'for January to June 2027, at $20 an hour.' if n else
            'Careers at Statedoku, a free daily US geography puzzle: no internship is open at the moment. '
            'New openings are listed on this page.')
    items = ''.join(f'<li><a href="/careers/{o["slug"]}/">{E(o["title"])}</a><p>{E(o["lead"])}</p></li>'
                    for o in OPENINGS)
    out = head(title, desc, path, crumbs([('Home', '/'), ('Careers', path)]))
    if OPENINGS:
        offers = (f'    <p class="job-lead">We are hiring {len(OPENINGS)} paid interns for January to June 2027. '
                  'The internships are fully remote, for students and recent graduates living in New York State.</p>\n'
                  f'    {terms_table()}\n'
                  f'    <h2>Open internships</h2>\n    <ul class="job-list">{items}</ul>\n')
    else:
        offers = (f'    <p class="job-lead">There is no open internship at the moment. '
                  f'New openings will be listed on this page; you can also write to {EMAIL}.</p>\n')
    out += (f'    <h1>Careers at Statedoku</h1>\n' + offers +
            f'    <h2>About Statedoku</h2>\n    <p>{E(ABOUT_SD)}</p>\n'
            '    <p><a href="/">Play today\'s puzzle</a> or read <a href="/about/">how the site is made</a>.</p>\n')
    return path, out + tail()


def pages():
    return [hub_page()] + [job_page(o) for o in OPENINGS]


def main():
    check = '--check' in sys.argv
    import datetime
    today_ny = (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=5)).date().isoformat()
    if OPENINGS and today_ny > DEADLINE:
        sys.exit(f'The deadline {DEADLINE} has passed with {len(OPENINGS)} openings still listed: '
                 'remove the filled or closed ones from OPENINGS (301 to /careers/, out of the sitemap), '
                 'or move DEADLINE if the owner extends it.')
    stale = []
    for path, text in pages():
        if re.search('[‐-―−]', text):
            sys.exit(f'{path}: unicode dash')
        f = os.path.join(ROOT, path.strip('/'), 'index.html')
        old = open(f, encoding='utf-8').read() if os.path.exists(f) else None
        norm = lambda s: s or ''
        if norm(old) != norm(text):
            stale.append(path)
            if not check:
                os.makedirs(os.path.dirname(f), exist_ok=True)
                open(f, 'w', encoding='utf-8').write(text)
    print(f'{len(pages())} careers pages, {len(OPENINGS)} openings; ' +
          (f'stale: {stale}' if check else f'written: {stale or "none changed"}'))
    if check and stale:
        sys.exit(1)


if __name__ == '__main__':
    main()
