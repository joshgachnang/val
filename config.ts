import * as process from 'process';

export default class Config {
  id: string;
  name = process.env.VERONICA_NAME || 'veronica';
  baseUrl = process.env.BASE_URL || 'http://localhost:8080';
  MODULES = [
    // './modules/googleCalendar',
    // './modules/uber'
  ];

  adapters = [
    './adapters/slack',
    './adapters/twilio',
    './adapters/alexa',
  ];

  plugins = [
    './plugins/users',
    './plugins/mongo-brain',
    // './plugins/log',
    './plugins/forecastio',
    './plugins/inspirationalQuote',
    './plugins/cta',
    './plugins/googleCalendar',
    './plugins/recipe',
    './plugins/meditation',
    './plugins/alarm',
    './plugins/dogecoin',
    // './plugins/remember',
    // './plugins/echo',
    // './plugins/deploy',
    // './plugins/help',
    // './plugins/frontendQuote/index',
    // './plugins/goodmorning',
    // './plugins/weather',
    // '../node_modules/hubot-scripts/src/scripts/ackbar.coffee',
    // '../node_modules/hubot-scripts/src/scripts/coin.coffee',
    // './node_modules/hubot-scripts/src/scripts/dealwithit.coffee',
    // '../node_modules/hubot-scripts/src/scripts/go-for-it.coffee',
    // '../node_modules/hubot-scripts/src/scripts/xkcd.coffee',
  ];
  UBER_CLIENT_ID = '';
  UBER_CLIENT_SECRET = '';
  UBER_SERVER_TOKEN = '';
  UBER_APP_NAME = 'LIFE';
  LATITUDE = process.env.LATITUDE || 41.0000;
  LONGITUDE = process.env.LONGITUDE || -87.0000;
  CTA_TRAIN_API_KEY = process.env.CTA_TRAIN_API_KEY;
  CTA_TRAIN_MAP_ID = process.env.CTA_TRAIN_MAP_ID || '41320';
  DARKSKY_KEY = process.env.DARKSKY_KEY;
  GOOGLE_CALENDAR_CLIENT_SECRET = {
    'installed': {
      'client_id': '',
      'project_id': '',
      'auth_uri': 'https://accounts.google.com/o/oauth2/auth',
      'token_uri': 'https://accounts.google.com/o/oauth2/token',
      'auth_provider_x509_cert_url': 'https://www.googleapis.com/oauth2/v1/certs',
      'client_secret': '',
      'redirect_uris': ['urn:ietf:wg:oauth:2.0:oob', 'http://localhost']
    }
  };
  CALENDAR_NAMES = ['LBB', 'Bills', 'pcsforeducation@gmail.com', 'josh.gachnang@triggrhealth.com'];
  /* tslint:disable */
  QUOTES = [
    'Look at that sexy dude!',
    'Woah, stylin\' today',
    'Damn guuuurrrrl',
    'Such sexy, much handsome, wow',
    'You are having a great hair day',
    'I\'m jealous of that shirt',
    'Go kick some ass today!',
    'Who\'s world is that? Josh Gachnang\'s world.'
  ];
  INSPIRATIONAL_QUOTES = [
    `"It's not knowing what to do, it's doing what you know." -Tony Robbins`,
    `"Focus on being productive instead of busy." -Tim Ferriss`,
    `"The key is not to prioritize what's on your schedule, but to schedule your priorities." -Stephen Covey`,
    `"Ordinary people think merely of spending time, great people think of using it." -Arthur Schopenhauer`,
    `"Your mind is for having ideas, not holding them." -David Allen`,
    `"Success is often achieved by those who don't know that failure is inevitable." -Coco Chanel`,
    `"If you don't pay appropriate attention to what has your attention, it will take more of your attention than it deserves." -David Allen`,
    `"Action is the foundational key to all success." -Pablo Picasso`,
    `"Productivity is never an accident. It is always the result of a commitment to excellence, intelligent planning, and focused effort." -Paul J. Meyer`,
    `"The only way around is through." -Robert Frost`,
    `"It's not always that we need to do more but rather that we need to focus on less." -Nathan W. Morris`,
    `"Productivity is being able to do things that you were never able to do before." -Franz Kafka`,
    `"Life is too complicated not to be orderly." -Martha Stewart`,
    `"You don't need a new plan for next year. You need a commitment." -Seth Godin`,
    `"The critical ingredient is getting off your butt and doing something. It's as simple as that. A lot of people have ideas, but there are few who decide to do something about them now. Not tomorrow. Not  next week. But today." -Nolan Bushnell`,
    `"Until we can manage time, we can manage nothing else." -Peter Drucker`,
    `"If you spend too much time thinking about a thing, you'll never get it done." -Bruce Lee`,
    `"Once you have mastered time, you will understand how true it is that most people overestimate what they can accomplish in a year-and underestimate what they can achieve in a decade!" -Tony Robbins`,
    `"Great acts are made up of small deeds." -Lao Tzu`,
    `"It's fine to decide not to decide about something. You just need a decide-not-to-decide system to get it off your mind." -David Allen`,
    `"Don't wait. The time will never be just right." -Napoleon Hill`,
    `"It is not enough to be busy. . . . The question is: what are we busy about?" -Henry David Thoreau`,
    `"There's a tendency to mistake preparation for productivity. You can prepare all you want, but if you never roll the dice you'll never be successful." -Shia LaBeouf`,
    `"You only have to do a very few things right in your life so long as you don't do too many things wrong." -Warren Buffett`,
    `"When you have to make a choice and don't make it, that in itself is a choice." -William James`,
    `"Effective performance is preceded by painstaking preparation" -Brian Tracy`,
    `"The way to get started is to quit talking and begin doing." -Walt Disney`,
    `"Your work is going to fill a large part of your life, and the only way to be truly satisfied is to do what you believe is great work. And the only way to do great work is to love what you do. If you    haven't found it yet, keep looking. Don't settle. As with all matters of the heart, you'll know when you find it." -Steve Jobs`,
    `"People often remark that I'm pretty lucky. Luck is only important in so far as getting the change to sell yourself at the right moment. After that, you've got to have talent and know how to use it." -  Frank Sinatra`,
    `"You were born to win, but to be a winner, you must plan to win, prepare to win, and expect to win." -Zig Ziglar`,
    `"Sometimes, things may not go your way, but the effort should be there every single night." -Michael Jordan`,
    `"Believe in yourself! Have faith in your abilities! Without a humble but reasonable confidence in your own powers you cannot be successful or happy." -Norman Vincent Peale`,
    `"Plans are nothing; planning is everything." -Dwight D. Eisenhower`,
    `"There are risks and costs to action. But they are far less than the long range risks of comfortable inaction." -John F. Kennedy`,
    `"Simplicity boils down to two steps: Identify the essential. Eliminate the rest." -Leo Babauta`,
    `"Live daringly, boldly, fearlessly. Taste the relish to be found in competition - in having put forth the best within you." -Henry J. Kaiser`,
    `"The simple act of paying positive attention to people has a great deal to do with productivity." -Tom Peters`,
    `"If you have time to whine then you have time to find solution." ―Dee Dee Artner`,
    `"I get to do what I like to do every single day of the year." -Warren Buffett`,
    `"No matter how many personal productivity techniques you master, there will always be more to do than you can ever accomplish in the time you have available to you, no matter how much it is." -Brian Tracy`,
    `"Amateurs sit and wait for inspiration, the rest of us just get up and go to work." -Stephen King`,
    `"Whenever you are asked if you can do a job, tell em, 'Certainly I can!' Then get busy and find out how to do it." -Theodore Roosevelt`,
    `"To be disciplined is to follow in a good way. To be self-disciplined is to follow in a better way." -Corita Kent`,
    `"Time is not refundable; use it with intention." -Unknown`,
    `"Starve your distraction and feed your focus." -Unknown`,
    `"Create with the heart; build with the mind." -Criss Jami`,
    `"Passion is energy. Feel the power that comes from focusing on what excites you." -Oprah Winfrey`,
    `"Reflect on what you do in a day. You may have never realized how some simple harmless activities rob you of precious time." -Vivek Naik`,
    `"Start by doing what is necessary, then do what's possible, and suddenly you are doing the impossible." -Saint Francis of Assisi`,
    `"Remember that failure is an event, not a person." -Zig Ziglar`,
    `"Time is equal opportunity employer. Each human being has exactly the same number of hours and minutes in a day." -Denis Waitley`,
    `"He who is not courageous enough to take risks will accomplish nothing in life." -Muhammad Ali`,
    `"To think is easy. To act is difficult. To act as one thinks is the most difficult." -Johann Wolfgang von Goethe`,
    `"There is no substitute for hard work." -Thomas Edison`,
    `"When we truly need to do is often what we most feel like avoiding." -David Allen`,
    `"Stressing output is the key to improving productivity, while looking to increase activity can result in just the opposite." -Paul Gauguin`,
    `"One of the great challenges of our age, in which the tools of our productivity are also the tools of our leisure, is to figure out how to make more useful those moments of procrastination when we're idling in front of our computer screens." -Joshua Foer`,
    `"When you waste a moment, you have killed it in a sense, squandering an irreplaceable opportunity. But when you use the moment properly, filling it with purpose and productivity, it lives on forever." -Menachem Mendel Scheerson`,
    `"Words may show a man's wit but actions will show his meaning." -Benjamin Franklin`,
    `"You don't have to see the whole staircase, just take the first step." -Martin Luther King`,
    `"Never mistake motion for action." -Ernest Hemingway`,
    `"You don't get paid for the hour, you get paid for the value you bring to the hour." -Jim Rohn`,
    `"Tomorrow hopes we have learned something from yesterday." -John Wayne`,
    `"Don't watch the clock; do what it does. Keep going." -Sam Levenson`,
    `"Take time to deliberate, but when the time for action has arrived, stop thinking and go in." - Napoleon Bonaparte`,
    `"All our productivity, leverage and insight comes from being part of a community, not apart from it. The goal, I think, is to figure out how to become more dependent, not less." -Seth Godin`,
    `"Excellence is an art won by training and habituation. We do not act rightly because we have virtue or excellence, but we rather have those because we have acted rightly. We are what we repeatedly do. Excellence, then, is not an act but a habit." -Aristotle`,
    `"While one person hesitates because he feels inferior, the other is busy making mistakes and becoming superior." -Henry C Link`,
    `"Lost time is never found." -Benjamin Franklin`,
    `"Don't confuse activity with productivity. Many people are simply busy being busy." -Robin Sharma`,
    `"What looks like multitasking is really switching back and forth between multiple tasks, which reduces productivity and increases mistakes by up to 50 percent." -Susan Cain`,
    `"Do the hard jobs first. The easy jobs will take care of themselves." -Dale Carnegie`,
    `"Productivity is the deliberate, strategic investment of your time, talent, intelligence, energy, resources, and opportunities in a manner calculated to move you measurably closer to meaningful goals." -Dan S Kennedy`,
    `"Obstacles are those frightful things you see when you take your eyes off the goal." -Henry Ford`,
    `"Sameness leaves us in peace but it is contradiction that makes us productive." -Johnann Wolfgang Goethe`,
    `"Over the long run, the unglamorous habit of frequency fosters both productivity and creativity." -Gretchen Rubin`,
    `"Knowledge is the source of wealth. Applied to tasks we already know, it becomes productivity. Applied to tasks that are new, it becomes innovation." -Peter Drucker`,
    `"The three great essentials to achieve anything worthwhile are: hard work, stick-to-itiveness, and common sense." -Thomas Edison`,
    `"If you want an easy job to seem mighty hard, just keep putting if off." -Richard Miller`,
    `"Procrastination is the fear of success. People procrastinate because they are afraid of the success that they know will result if they move ahead now. Because success is heavy, carries a responsibility with it, it is much easier to procrastinate and live on the 'someday I'll' philosophy." -Denis Waitley`,
    `"Nothing in the world can take the place of persistence." -Calvin Coolidge`,
    `"Work hard, have fun and make history." -Jeff Bezos`,
    `"Don't worry about breaks every 20 minutes ruining your focus on a task. Contrary to what I might have guessed, taking regular breaks from mental tasks actually improves your creativity and productivity. Skipping breaks, on the other hand, leads to stress and fatigue." -Tom Rath`,
    `"I do not equate productivity to happiness. For most people, happiness in life is a massive amount of achievement plus a massive amount of appreciation. And you need both of those things." -Tim Ferriss`,
    `"The merit in action lies in finishing it to the end." -Genghis Khan`,
    `"There is never enough time to do it right, but there is always enough time to do it over." -John W. Bergman`,
    `"Creativity isn't about wild talent as much as it's about productivity. To find new ideas that work, you need to try a lot that don't. It's a pure numbers game." -Robert Sutton`,
    `"Position yourself to succeed by doing the other things in your life that rejuvenate you. Exhaustion affect your quality and productivity." -Jeff VanderMeer`,
    `"Productivity growth, however it occurs, has a disruptive side to it. In the short term, most things that contribute to productivity growth are very painful." -Janet Yellen`,
    `"If you want something done, give it to a busy man." -Stephen Covey`,
    `"The key to productivity is to rotate your avoidance techniques." -Shannon Wheeler`,
    `"The really happy people are those who have broken the chains of procrastination, those who find satisfaction in doing the job at hand. They're full of eagerness, zest, productivity. You can be, too." - Norman Vincent Peale`,
    `"It is not the strongest of the species that survive, nor the most intelligent, but the one most responsive to change." -Charles Darwin`,
    `"I always had the uncomfortable feeling that if I wasn't sitting in front of a computer typing, I was wasting my time - but I pushed myself to take a wider view of what was 'productive.' Time spent with my family and friends was never wasted." - Gretchen Rubin`,
    `"If we all did the things we are capable of doing, we would literally astound ourselves." - Thomas Alva Edison`,
    `Life's gardeners pluck the weeds and care only for the productive plants." ― Bryant McGill`,
    `"The true price of anything you do is the amount of time you exchange for it." ― Henry David Thoreau`,
    `'It is not the mountain we conquer, but ourselves.' ― Sir Edmund Hillary`,
    `'Twenty years from now you will be more disappointed by the things you didn't do than by the ones you did do. So throw off the bowlines. Sail away from the safe harbor. Catch the trade winds in your sail. Explore. Dream. Discover.' ― Mark Twain`,
    `'Multitasking is a lie' ― Gary Keller`,
  	`"Your time is limited, so don't waste it living someone else's life. Don't be trapped by dogma - which is living with the results of other people's thinking. Don't let the noise of other's opinions drown out your own inner voice. And most important, have the courage to follow your heart and intuition." - Steve Jobs`,
  ];
  /* tslint:enable */
  GUIDED_MEDITATION_URL = process.env.GUIDED_MEDITATION_URL;
  LAYOUT = {
    topLeft: [
      'clock-simple',
      'google-calendar'
    ],
    topCenter: [
      'reason-sober'
    ],
    topRight: [
      'forecastio-simple'
    ],
    bottomLeft: [
      'cta-train-schedule',
      'uber-estimate'
    ],
    bottomCenter: [],
    bottomRight: [
    ]
  };
  AUTH = {
    'googleAuth': {
      'clientID': '',
      'clientSecret': '',
      'callbackURL': 'https://recipe.nang.in/auth/google/callback'
    }
  };
  JWT_SECRET = 'lol';
  SESSION_SECRET = 'lmao';
  IMGUR_CLIENT_ID = '';
  IMGUR_CLIENT_SECRET = '';
  IMGUR_PASSWORD = '';
  IMGUR_EMAIL = '';
  // API Token from Slack custom bot integration
  SLACK_TOKEN = '';
  BOT_NAME: string = 'R2-D2';
  PLUGINS = {
      DEPLOY: {
        DEPLOY_COMMAND: 'cd /var/deploy && make deploy'
      }
    };
};
