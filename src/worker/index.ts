import { Hono } from "hono";

const app = new Hono();
const DEFAULT_TRACK_ID = "3210709941";
const CATEGORY_KEYS = ["oldies", "modern", "holiday"] as const;
type CategoryKey = (typeof CATEGORY_KEYS)[number];
const BASE_CATEGORY_KEYS: readonly CategoryKey[] = ["oldies", "modern"];
const HOLIDAY_CATEGORY: CategoryKey = "holiday";

const CATEGORY_DEFAULT_TRACKS: Record<CategoryKey, string> = {
	oldies: "116348656", // The Beatles - Let It Be
	modern: DEFAULT_TRACK_ID,
	holiday: "62710442", // Mariah Carey - All I Want for Christmas Is You
};

const WEEKLY_TRACK_SCHEDULE: Record<string, Partial<Record<CategoryKey, string>>> = {
	"2025-12-11": {
		oldies: "426703682", // Eagles - Hotel California
		modern: "3210709941", // Alex Warren - Ordinary
		holiday: "62710442", // Mariah Carey - All I Want for Christmas Is You
	},
	"2025-12-12": {
		oldies: "904732", // Aretha Franklin - Respect
		modern: "1332676982", // Taylor Swift - Love Story (TV)
		holiday: "1036586", // Wham! - Last Christmas
	},
	"2025-12-13": {
		oldies: "568115892", // Queen - Bohemian Rhapsody
		modern: "92734438", // Mark Ronson - Uptown Funk
		holiday: "24136731", // Brenda Lee - Rockin' Around The Christmas Tree
	},
	"2025-12-14": {
		oldies: "596034702", // Stevie Wonder - Superstition
		modern: "1174604652", // Adele - Hello
		holiday: "474645692", // Bobby Helms - Jingle Bell Rock
	},
	"2025-12-15": {
		oldies: "63480987", // Fleetwood Mac - Dreams
		modern: "908604612", // The Weeknd - Blinding Lights
		holiday: "585967", // Andy Williams - It's the Most Wonderful Time of the Year
	},
	"2025-12-16": {
		oldies: "1133408852", // Marvin Gaye - What's Going On
		modern: "1378342592", // Olivia Rodrigo - drivers license
		holiday: "1934770197", // Michael Bublé - It's Beginning to Look a Lot Like Christmas
	},
	"2025-12-17": {
		oldies: "625643", // Journey - Don't Stop Believin'
		modern: "1703487577", // Harry Styles - As It Was
		holiday: "90728983", // Ariana Grande - Santa Tell Me
	},
	"2025-12-18": {
		oldies: "7818900", // The Rolling Stones - Paint It, Black
		modern: "655095912", // Billie Eilish - bad guy
		holiday: "131745958", // Kelly Clarkson - Underneath the Tree
	},
	"2025-12-19": {
		oldies: "75981528", // Whitney Houston - I Wanna Dance with Somebody
		modern: "2105158337", // Miley Cyrus - Flowers
		holiday: "991049", // José Feliciano - Feliz Navidad
	},
	"2025-12-20": {
		oldies: "374283061", // Prince - Purple Rain
		modern: "747399352", // Post Malone - Circles
		holiday: "584448352", // Burl Ives - A Holly Jolly Christmas
	},
	"2025-12-21": {
		oldies: "2525864", // The Police - Every Breath You Take
		modern: "2525537871", // Dua Lipa - Houdini
		holiday: "3399685", // Bing Crosby - White Christmas
	},
	"2025-12-22": {
		oldies: "14333215", // Billy Joel - Piano Man
		modern: "2743578151", // Sabrina Carpenter - Espresso
		holiday: "4228126", // Nat King Cole - The Christmas Song (Merry Christmas To You)
	},
	"2025-12-23": {
		oldies: "3102931", // The Beach Boys - God Only Knows
		modern: "2055292027", // SZA - Kill Bill
		holiday: "70662094", // Dean Martin - Let It Snow! Let It Snow! Let It Snow!
	},
	"2025-12-24": {
		oldies: "551383", // Elvis Presley - Can't Help Falling In Love
		modern: "1976903157", // Taylor Swift - Anti-Hero
		holiday: "3465341", // Frank Sinatra - Have Yourself A Merry Little Christmas
	},
	"2025-12-25": {
		oldies: "116348464", // The Beatles - Here Comes The Sun
		modern: "1952718637", // Noah Kahan - Homesick
		holiday: "13072996", // The Ronettes - Sleigh Ride
	},
	"2025-12-26": {
		oldies: "884025", // ABBA - Dancing Queen
		modern: "602456552", // Post Malone & Swae Lee - Sunflower
		holiday: "640963102", // Paul McCartney - Wonderful Christmastime
	},
	"2025-12-27": {
		oldies: "487484142", // Earth, Wind & Fire - September
		modern: "2387373015", // Doja Cat - Paint The Town Red
		holiday: "609537", // Gene Autry - Rudolph the Red-Nosed Reindeer
	},
	"2025-12-28": {
		oldies: "538643262", // The Temptations - My Girl
		modern: "2710032012", // Hozier - Too Sweet
		holiday: "7163389", // John Lennon & Yoko Ono - Happy Xmas (War Is Over)
	},
	"2025-12-29": {
		oldies: "540189172", // The Supremes - You Can't Hurry Love
		modern: "737967292", // Taylor Swift - Cruel Summer
		holiday: "13073002", // Darlene Love - Christmas (Baby Please Come Home)
	},
	"2025-12-30": {
		oldies: "1045832272", // Queen - Don't Stop Me Now
		modern: "2925741361", // Billie Eilish - What Was I Made For?
		holiday: "7372854", // Chuck Berry - Run Rudolph Run
	},
	"2025-12-31": {
		oldies: "139902529", // Frank Sinatra - New York, New York
		modern: "2299840635", // Dua Lipa - Dance The Night
		holiday: "4601779", // Jackson 5 - Santa Claus Is Coming To Town
	},
	"2026-01-01": {
		oldies: "7193834", // John Lennon - Imagine
		modern: "2614318122", // Ariana Grande - yes, and?
		holiday: "14881466", // Elvis Presley - Blue Christmas
	},
	"2026-01-02": {
		oldies: "27533911", // Earth, Wind & Fire - Let's Groove
		modern: "2444176345", // Tate McRae - greedy
	},
	"2026-01-03": {
		oldies: "1025659", // Billy Joel - Uptown Girl
		modern: "2440763155", // Olivia Rodrigo - vampire
	},
	"2026-01-04": {
		oldies: "3091978", // The Beach Boys - Wouldn't It Be Nice (Remastered 1999)
		modern: "2672689962", // SZA - Saturn
	},
	"2026-01-05": {
		oldies: "561836", // Eurythmics - Sweet Dreams (Are Made of This) (2005 Remaster)
		modern: "2728070371", // Chappell Roan - Good Luck, Babe!
	},
	"2026-01-06": {
		oldies: "546004", // Daryl Hall & John Oates - You Make My Dreams (Come True)
		modern: "2610711672", // Benson Boone - Beautiful Things
	},
	"2026-01-07": {
		oldies: "664178", // Prince - Kiss
		modern: "2801558032", // Billie Eilish - LUNCH
	},
	"2026-01-08": {
		oldies: "568115782", // Queen - Somebody To Love (2011 Remaster)
		modern: "2185094157", // Sabrina Carpenter - Feather
	},
	"2026-01-18": {
		oldies: "4603408", // Michael Jackson - Billie Jean
		modern: "2743578151", // Sabrina Carpenter - Espresso
	},
	"2026-01-19": {
		oldies: "664507", // Madonna - Like a Prayer
		modern: "2444176345", // Tate McRae - greedy
	},
	"2026-01-20": {
		oldies: "72194071", // Cyndi Lauper - Girls Just Want to Have Fun
		modern: "2728070371", // Chappell Roan - Good Luck, Babe!
	},
	"2026-01-21": {
		oldies: "538660022", // Bon Jovi - Livin' On A Prayer
		modern: "2610711672", // Benson Boone - Beautiful Things
	},
	"2026-01-22": {
		oldies: "426703682", // Eagles - Hotel California (2013 Remaster)
		modern: "2105158337", // Miley Cyrus - Flowers
	},
	"2026-01-23": {
		oldies: "92720046", // AC/DC - Back In Black
		modern: "2757495911", // Taylor Swift - Fortnight
	},
	"2026-01-24": {
		oldies: "88902741", // Bryan Adams - Summer Of '69
		modern: "2690050002", // Ariana Grande - we can't be friends (wait for your love)
	},
	"2026-01-25": {
		oldies: "518458172", // Guns N' Roses - Sweet Child O' Mine
		modern: "2780753191", // Post Malone - I Had Some Help
	},
	"2026-01-26": {
		oldies: "14525086", // George Michael - Careless Whisper
		modern: "2729273551", // Shaboozey - A Bar Song (Tipsy)
	},
	"2026-01-27": {
		oldies: "1079668", // Toto - Africa
		modern: "2831602002", // Sabrina Carpenter - Please Please Please
	},
	"2026-01-28": {
		oldies: "134036212", // Phil Collins - In the Air Tonight (2015 Remaster)
		modern: "2801558052", // Billie Eilish - BIRDS OF A FEATHER
	},
	"2026-01-29": {
		oldies: "4125592", // The Rolling Stones - Start Me Up (Remastered 2009)
		modern: "908604632", // The Weeknd - Save Your Tears
	},
	"2026-01-30": {
		oldies: "347363311", // U2 - With Or Without You
		modern: "2525537871", // Dua Lipa - Houdini
	},
	"2026-01-31": {
		oldies: "15586246", // Bruce Springsteen - Dancing In the Dark
		modern: "2710032012", // Hozier - Too Sweet
	},
	"2026-02-01": {
		oldies: "88845911", // Tears For Fears - Everybody Wants To Rule The World
		modern: "2055292027", // SZA - Kill Bill
	},

	// --- February 2026 ---
	"2026-02-02": {
		oldies: "406815322", // Bee Gees - Stayin' Alive
		modern: "1109731", // Eminem - Lose Yourself
	},
	"2026-02-03": {
		oldies: "1911181457", // Michael Jackson - Thriller
		modern: "609244", // Beyoncé - Crazy in Love
	},
	"2026-02-04": {
		oldies: "1267950", // Gloria Gaynor - I Will Survive
		modern: "1101619", // OutKast - Hey Ya!
	},
	"2026-02-05": {
		oldies: "74467598", // Elton John - Rocket Man
		modern: "959183", // Alicia Keys - Fallin'
	},
	"2026-02-06": {
		oldies: "530300621", // Bob Marley - No Woman No Cry
		modern: "6899831", // Rihanna - Umbrella
	},
	"2026-02-07": {
		oldies: "13693497", // Nirvana - Smells Like Teen Spirit
		modern: "5756651", // Amy Winehouse - Rehab
	},
	"2026-02-08": {
		oldies: "1172823", // Led Zeppelin - Whole Lotta Love
		modern: "3121415", // Lady Gaga - Just Dance
	},
	"2026-02-09": {
		oldies: "1075638", // Tom Petty - Free Fallin'
		modern: "2485118", // Beyoncé - Single Ladies
	},
	"2026-02-10": {
		oldies: "461043312", // David Bowie - Heroes
		modern: "10432402", // Bruno Mars - Just The Way You Are
	},
	"2026-02-11": {
		oldies: "985745702", // Oasis - Wonderwall
		modern: "1174602992", // Adele - Rolling in the Deep
	},
	"2026-02-12": {
		oldies: "1075781", // TLC - No Scrubs
		modern: "119615552", // Gotye - Somebody That I Used to Know
	},
	"2026-02-13": {
		oldies: "884781", // Spice Girls - Wannabe
		modern: "701326562", // Pharrell Williams - Happy
	},
	"2026-02-14": {
		oldies: "880181", // Elton John - Your Song
		modern: "139470659", // Ed Sheeran - Shape of You
	},
	"2026-02-15": {
		oldies: "77002901", // The Cranberries - Dreams
		modern: "908605332", // Dua Lipa - Levitating
	},
	"2026-02-16": {
		oldies: "678044", // Green Day - Basket Case
		modern: "1378342612", // Olivia Rodrigo - good 4 u
	},
	"2026-02-17": {
		oldies: "885421", // James Brown - I Got You (I Feel Good)
		modern: "124603270", // Drake - One Dance
	},
	"2026-02-18": {
		oldies: "77700217", // Jimi Hendrix - Purple Haze
		modern: "407250732", // Lizzo - Truth Hurts
	},
	"2026-02-19": {
		oldies: "9397861", // The Who - Baba O'Riley
		modern: "908604602", // Harry Styles - Watermelon Sugar
	},
	"2026-02-20": {
		oldies: "136334560", // R.E.M. - Losing My Religion
		modern: "797228462", // Doja Cat - Say So
	},
	"2026-02-21": {
		oldies: "871289", // Alanis Morissette - Ironic
		modern: "1040154662", // Glass Animals - Heat Waves
	},
	"2026-02-22": {
		oldies: "565656032", // David Bowie - Let's Dance
		modern: "136889400", // The Weeknd - Starboy
	},
	"2026-02-23": {
		oldies: "3121608", // Blondie - Heart of Glass
		modern: "629899842", // Ariana Grande - 7 rings
	},
	"2026-02-24": {
		oldies: "69962764", // The Clash - Should I Stay or Should I Go
		modern: "350171311", // Kendrick Lamar - HUMBLE.
	},
	"2026-02-25": {
		oldies: "59917151", // Backstreet Boys - I Want It That Way
		modern: "88101691", // Taylor Swift - Shake It Off
	},
	"2026-02-26": {
		oldies: "538706952", // Donna Summer - Hot Stuff
		modern: "88101681", // Taylor Swift - Blank Space
	},
	"2026-02-27": {
		oldies: "62882811", // Diana Ross - Ain't No Mountain High Enough
		modern: "2831602042", // Gracie Abrams - That's So True
	},
	"2026-02-28": {
		oldies: "917931", // Lionel Richie - All Night Long (All Night)
		modern: "2454854845", // Chappell Roan - Pink Pony Club
	},

	// --- March 2026 ---
	"2026-03-01": {
		oldies: "4399648", // The Jackson 5 - I Want You Back
		modern: "2055292047", // Noah Kahan - Stick Season
	},
	"2026-03-02": {
		oldies: "15275788", // Simon & Garfunkel - The Sound of Silence
		modern: "2610711682", // Teddy Swims - Lose Control
	},
	"2026-03-03": {
		oldies: "78476961", // Otis Redding - (Sittin' On) The Dock of the Bay
		modern: "2444176355", // Zach Bryan - I Remember Everything
	},
	"2026-03-04": {
		oldies: "15026481", // Bob Dylan - Like a Rolling Stone
		modern: "3398329531", // Morgan Wallen - Last Night
	},
	"2026-03-05": {
		oldies: "64531041", // Janet Jackson - Rhythm Nation
		modern: "2194033397", // Luke Combs - Fast Car
	},
	"2026-03-06": {
		oldies: "904684", // Aretha Franklin - Think
		modern: "1378342602", // Olivia Rodrigo - brutal
	},
	"2026-03-07": {
		oldies: "116914122", // Pink Floyd - Comfortably Numb
		modern: "2801558072", // Billie Eilish - Happier Than Ever
	},
	"2026-03-08": {
		oldies: "7675129", // Pearl Jam - Even Flow
		modern: "797228502", // Doja Cat - Streets
	},
	"2026-03-09": {
		oldies: "62770021", // Destiny's Child - Say My Name
		modern: "1711360637", // Jack Harlow - First Class
	},
	"2026-03-10": {
		oldies: "72194073", // Cyndi Lauper - Time After Time
		modern: "1756569577", // Harry Styles - Late Night Talking
	},
	"2026-03-11": {
		oldies: "4763165", // Michael Jackson - Beat It
		modern: "1189202982", // SZA - Good Days
	},
	"2026-03-12": {
		oldies: "1151503", // Elton John - Tiny Dancer
		modern: "1122450992", // Bad Bunny - Dakiti
	},
	"2026-03-13": {
		oldies: "596034712", // Stevie Wonder - Sir Duke
		modern: "1378342622", // Justin Bieber - Peaches
	},
	"2026-03-14": {
		oldies: "24246391", // No Doubt - Don't Speak
		modern: "1378342632", // The Kid LAROI - STAY
	},
	"2026-03-15": {
		oldies: "3614129", // The Doors - Light My Fire
		modern: "629466", // Alicia Keys - If I Ain't Got You
	},
	"2026-03-16": {
		oldies: "2542705", // Bob Marley - Redemption Song
		modern: "1959441337", // SZA - Snooze
	},
	"2026-03-17": {
		oldies: "63480990", // Fleetwood Mac - Go Your Own Way
		modern: "1818665207", // Lizzo - About Damn Time
	},
	"2026-03-18": {
		oldies: "1043894", // TLC - Waterfalls
		modern: "447098092", // Camila Cabello - Havana
	},
	"2026-03-19": {
		oldies: "918048", // Lionel Richie - Hello
		modern: "623698142", // Luis Fonsi - Despacito
	},
	"2026-03-20": {
		oldies: "63480997", // Sam Cooke - A Change Is Gonna Come
		modern: "112662368", // Justin Bieber - Love Yourself
	},
	"2026-03-21": {
		oldies: "1172833", // Led Zeppelin - Stairway to Heaven
		modern: "136336116", // Bruno Mars - That's What I Like
	},
	"2026-03-22": {
		oldies: "88845921", // Simple Minds - Don't You (Forget About Me)
		modern: "349385251", // Charlie Puth - Attention
	},
	"2026-03-23": {
		oldies: "116914042", // Pink Floyd - Wish You Were Here
		modern: "143172408", // Khalid - Location
	},
	"2026-03-24": {
		oldies: "1286183", // Pearl Jam - Black
		modern: "969494", // Justin Timberlake - Cry Me a River
	},
	"2026-03-25": {
		oldies: "3092940", // Human League - Don't You Want Me
		modern: "15489383", // Justin Timberlake - SexyBack
	},
	"2026-03-26": {
		oldies: "538660032", // Def Leppard - Pour Some Sugar on Me
		modern: "1409072752", // Ed Sheeran - Bad Habits
	},
	"2026-03-27": {
		oldies: "922014", // Sheryl Crow - All I Wanna Do
		modern: "536421002", // Travis Scott - Sicko Mode
	},
	"2026-03-28": {
		oldies: "925653", // Counting Crows - Mr. Jones
		modern: "533609232", // Drake - God's Plan
	},
	"2026-03-29": {
		oldies: "404618712", // The Cars - Just What I Needed
		modern: "129310248", // The Chainsmokers - Closer
	},
	"2026-03-30": {
		oldies: "1080638", // Heart - Barracuda
		modern: "16501728", // fun. - We Are Young
	},
	"2026-03-31": {
		oldies: "63480977", // Elvis Presley - Suspicious Minds
		modern: "862051992", // Dua Lipa - Physical
	},

	// --- April 2026 ---
	"2026-04-01": {
		oldies: "71647249", // Van Morrison - Brown Eyed Girl
		modern: "734508762", // Lady Gaga - Poker Face
	},
	"2026-04-02": {
		oldies: "78033230", // Roy Orbison - Oh, Pretty Woman
		modern: "4601933", // Lady Gaga - Bad Romance
	},
	"2026-04-03": {
		oldies: "2432823", // Marvin Gaye - Let's Get It On
		modern: "1174603092", // Adele - Someone Like You
	},
	"2026-04-04": {
		oldies: "1384398642", // Ray Charles - Hit the Road Jack
		modern: "14525574", // Rihanna - We Found Love
	},
	"2026-04-05": {
		oldies: "2321278", // The Mamas & The Papas - California Dreamin'
		modern: "61424045", // Macklemore - Thrift Shop
	},
	"2026-04-06": {
		oldies: "1157032812", // Cat Stevens - Wild World
		modern: "70403437", // Lorde - Royals
	},
	"2026-04-07": {
		oldies: "676880", // The Drifters - Under the Boardwalk
		modern: "79875064", // Ed Sheeran - Thinking Out Loud
	},
	"2026-04-08": {
		oldies: "856630", // Johnny Cash - Ring of Fire
		modern: "124603286", // Drake - Hotline Bling
	},
	"2026-04-09": {
		oldies: "109300764", // Procol Harum - A Whiter Shade of Pale
		modern: "106506516", // The Weeknd - Can't Feel My Face
	},
	"2026-04-10": {
		oldies: "542814742", // Patsy Cline - Crazy
		modern: "629899852", // Ariana Grande - thank u, next
	},
	"2026-04-11": {
		oldies: "114422238", // Dolly Parton - Jolene
		modern: "550269952", // Taylor Swift - Style
	},
	"2026-04-12": {
		oldies: "796316062", // Hank Williams - Your Cheatin' Heart
		modern: "143172406", // Khalid - Young Dumb & Broke
	},
	"2026-04-13": {
		oldies: "3108438", // Kenny Rogers - The Gambler
		modern: "491446942", // Post Malone - Rockstar
	},
	"2026-04-14": {
		oldies: "624738", // Willie Nelson - On the Road Again
		modern: "1410738042", // Doja Cat - Woman
	},
	"2026-04-15": {
		oldies: "82697686", // John Denver - Take Me Home, Country Roads
		modern: "897666672", // Megan Thee Stallion - Savage
	},
	"2026-04-16": {
		oldies: "63480992", // Fleetwood Mac - The Chain
		modern: "112662366", // Justin Bieber - Sorry
	},
	"2026-04-17": {
		oldies: "68094695", // Eagles - Take It Easy
		modern: "113418500", // Shawn Mendes - Stitches
	},
	"2026-04-18": {
		oldies: "625836", // Billy Joel - It's Still Rock and Roll to Me
		modern: "2347250765", // Troye Sivan - Rush
	},
	"2026-04-19": {
		oldies: "569548", // Hall & Oates - Rich Girl
		modern: "16149860", // Lana Del Rey - Summertime Sadness
	},

	// --- July 2026 ---
	"2026-07-04": {
		oldies: "15586213", // Bruce Springsteen - Born in the U.S.A.
		modern: "17135111", // Katy Perry - Firework
	},
	"2026-07-11": {
		oldies: "549298232", // Tom Jones - It's Not Unusual
		modern: "1999525067", // Drake & 21 Savage - Rich Flex
	},
	"2026-07-18": {
		oldies: "13143609", // The Isley Brothers - Shout
		modern: "1976903137", // Taylor Swift - Lavender Haze
	},
	"2026-07-25": {
		oldies: "71433037", // Van Morrison - Moondance
		modern: "1959441337", // SZA - Shirt
	},

	// --- August 2026 ---
	"2026-08-01": {
		oldies: "426703702", // Eagles - Life in the Fast Lane
		modern: "2744502371", // Dua Lipa - Illusion
	},
	"2026-08-08": {
		oldies: "624783", // Simon & Garfunkel - Mrs. Robinson
		modern: "1756569647", // Harry Styles - Daydreaming
	},
	"2026-08-15": {
		oldies: "107465566", // David Bowie - Space Oddity
		modern: "1977132317", // Taylor Swift - Karma
	},
	"2026-08-22": {
		oldies: "570650", // Jefferson Airplane - Somebody to Love
		modern: "2131709787", // Lizzo - Special
	},
	"2026-08-29": {
		oldies: "122210014", // John Lennon - Watching the Wheels
		modern: "1794149487", // Drake - Jimmy Cooks
	},

	// --- September 2026 ---
	"2026-09-05": {
		oldies: "13167146", // Bob Dylan - Mr. Tambourine Man
		modern: "1842063507", // Beyoncé - BREAK MY SOUL
	},
	"2026-09-12": {
		oldies: "1583117", // Traffic - The Low Spark of High-Heeled Boys
		modern: "1738347617", // Doja Cat - Vegas
	},
	"2026-09-19": {
		oldies: "96466138", // Creedence Clearwater Revival - Fortunate Son
		modern: "1977132317", // Taylor Swift - Midnights (3am Edition)
	},
	"2026-09-26": {
		oldies: "81001890", // Santana - Black Magic Woman
		modern: "1741494307", // Bad Bunny - Me Porto Bonito
	},

	// --- October 2026 ---
	"2026-10-03": {
		oldies: "128846783", // Johnny Cash - Hurt
		modern: "2300267935", // Taylor Swift - Snow on the Beach
	},
	"2026-10-10": {
		oldies: "664444", // Fleetwood Mac - Everywhere
		modern: "542389552", // Ariana Grande - No Tears Left to Cry
	},
	"2026-10-17": {
		oldies: "2525877", // The Police - Roxanne
		modern: "1775918617", // Post Malone - Reputation
	},
	"2026-10-24": {
		oldies: "121921372", // R.E.M. - Everybody Hurts
		modern: "1977132347", // Taylor Swift - The Great War
	},
	"2026-10-31": {
		oldies: "1911181457", // Michael Jackson - Thriller (Halloween!)
		modern: "655095992", // Billie Eilish - bury a friend
	},

	// --- November 2026 ---
	"2026-11-07": {
		oldies: "69070922", // Elvis Presley - Blue Suede Shoes
		modern: "144572210", // Drake - Passionfruit
	},
	"2026-11-14": {
		oldies: "116348452", // The Beatles - Come Together
		modern: "1124841642", // Dua Lipa - Future Nostalgia
	},
	"2026-11-21": {
		oldies: "640073442", // Paul McCartney - Maybe I'm Amazed
		modern: "655095962", // Billie Eilish - when the party's over
	},
	"2026-11-28": {
		oldies: "2812992", // Joni Mitchell - Big Yellow Taxi
		modern: "2477272471", // Noah Kahan - She Calls Me Back
	},

	// --- December 2026 (holiday season, cycling back through classics) ---
	"2026-12-01": {
		oldies: "426703682", // Eagles - Hotel California
		modern: "3210709941", // Alex Warren - Ordinary
		holiday: "62710442", // Mariah Carey - All I Want for Christmas Is You
	},
	"2026-12-02": {
		oldies: "884025", // ABBA - Dancing Queen
		modern: "737967292", // Taylor Swift - Cruel Summer
		holiday: "1036586", // Wham! - Last Christmas
	},
	"2026-12-03": {
		oldies: "568115892", // Queen - Bohemian Rhapsody
		modern: "92734438", // Mark Ronson ft. Bruno Mars - Uptown Funk
		holiday: "24136731", // Brenda Lee - Rockin' Around The Christmas Tree
	},
	"2026-12-04": {
		oldies: "406815322", // Bee Gees - Stayin' Alive
		modern: "1952718637", // Noah Kahan - Homesick
		holiday: "474645692", // Bobby Helms - Jingle Bell Rock
	},
	"2026-12-05": {
		oldies: "13693497", // Nirvana - Smells Like Teen Spirit
		modern: "908604612", // The Weeknd - Blinding Lights
		holiday: "585967", // Andy Williams - It's the Most Wonderful Time of the Year
	},
	"2026-12-06": {
		oldies: "63480990", // Fleetwood Mac - Go Your Own Way
		modern: "1378342592", // Olivia Rodrigo - drivers license
		holiday: "1934770197", // Michael Bublé - It's Beginning to Look a Lot Like Christmas
	},
	"2026-12-07": {
		oldies: "625643", // Journey - Don't Stop Believin'
		modern: "1703487577", // Harry Styles - As It Was
		holiday: "90728983", // Ariana Grande - Santa Tell Me
	},
	"2026-12-08": {
		oldies: "7818900", // The Rolling Stones - Paint It, Black
		modern: "655095912", // Billie Eilish - bad guy
		holiday: "131745958", // Kelly Clarkson - Underneath the Tree
	},
	"2026-12-09": {
		oldies: "75981528", // Whitney Houston - I Wanna Dance with Somebody
		modern: "2105158337", // Miley Cyrus - Flowers
		holiday: "991049", // José Feliciano - Feliz Navidad
	},
	"2026-12-10": {
		oldies: "374283061", // Prince - Purple Rain
		modern: "747399352", // Post Malone - Circles
		holiday: "584448352", // Burl Ives - A Holly Jolly Christmas
	},
	"2026-12-11": {
		oldies: "2525864", // The Police - Every Breath You Take
		modern: "2525537871", // Dua Lipa - Houdini
		holiday: "3399685", // Bing Crosby - White Christmas
	},
	"2026-12-12": {
		oldies: "14333215", // Billy Joel - Piano Man
		modern: "2743578151", // Sabrina Carpenter - Espresso
		holiday: "4228126", // Nat King Cole - The Christmas Song (Merry Christmas To You)
	},
	"2026-12-13": {
		oldies: "3102931", // The Beach Boys - God Only Knows
		modern: "2055292027", // SZA - Kill Bill
		holiday: "70662094", // Dean Martin - Let It Snow! Let It Snow! Let It Snow!
	},
	"2026-12-14": {
		oldies: "551383", // Elvis Presley - Can't Help Falling In Love
		modern: "1976903157", // Taylor Swift - Anti-Hero
		holiday: "3465341", // Frank Sinatra - Have Yourself A Merry Little Christmas
	},
	"2026-12-15": {
		oldies: "116348464", // The Beatles - Here Comes The Sun
		modern: "2710032012", // Hozier - Too Sweet
		holiday: "13072996", // The Ronettes - Sleigh Ride
	},
	"2026-12-16": {
		oldies: "884025", // ABBA - Dancing Queen
		modern: "602456552", // Post Malone & Swae Lee - Sunflower
		holiday: "640963102", // Paul McCartney - Wonderful Christmastime
	},
	"2026-12-17": {
		oldies: "487484142", // Earth, Wind & Fire - September
		modern: "2387373015", // Doja Cat - Paint The Town Red
		holiday: "609537", // Gene Autry - Rudolph the Red-Nosed Reindeer
	},
	"2026-12-18": {
		oldies: "538643262", // The Temptations - My Girl
		modern: "2801558052", // Billie Eilish - BIRDS OF A FEATHER
		holiday: "7163389", // John Lennon & Yoko Ono - Happy Xmas (War Is Over)
	},
	"2026-12-19": {
		oldies: "540189172", // The Supremes - You Can't Hurry Love
		modern: "2831602002", // Sabrina Carpenter - Please Please Please
		holiday: "13073002", // Darlene Love - Christmas (Baby Please Come Home)
	},
	"2026-12-20": {
		oldies: "1045832272", // Queen - Don't Stop Me Now
		modern: "2925741361", // Billie Eilish - What Was I Made For?
		holiday: "7372854", // Chuck Berry - Run Rudolph Run
	},
	"2026-12-21": {
		oldies: "139902529", // Frank Sinatra - New York, New York
		modern: "2299840635", // Dua Lipa - Dance The Night
		holiday: "4601779", // Jackson 5 - Santa Claus Is Coming To Town
	},
	"2026-12-22": {
		oldies: "1133408852", // Marvin Gaye - What's Going On
		modern: "2614318122", // Ariana Grande - yes, and?
		holiday: "62710442", // Mariah Carey - All I Want for Christmas Is You
	},
	"2026-12-23": {
		oldies: "596034702", // Stevie Wonder - Superstition
		modern: "2728070371", // Chappell Roan - Good Luck, Babe!
		holiday: "13072996", // The Ronettes - Sleigh Ride
	},
	"2026-12-24": {
		oldies: "551383", // Elvis Presley - Can't Help Falling In Love
		modern: "1976903157", // Taylor Swift - Anti-Hero
		holiday: "3465341", // Frank Sinatra - Have Yourself A Merry Little Christmas
	},
	"2026-12-25": {
		oldies: "116348464", // The Beatles - Here Comes The Sun
		modern: "1952718637", // Noah Kahan - Homesick
		holiday: "3399685", // Bing Crosby - White Christmas
	},
	"2026-12-26": {
		oldies: "63480990", // Fleetwood Mac - Go Your Own Way
		modern: "2743578151", // Sabrina Carpenter - Espresso
		holiday: "640963102", // Paul McCartney - Wonderful Christmastime
	},
	"2026-12-27": {
		oldies: "1045832272", // Queen - Don't Stop Me Now
		modern: "2710032012", // Hozier - Too Sweet
		holiday: "609537", // Gene Autry - Rudolph the Red-Nosed Reindeer
	},
	"2026-12-28": {
		oldies: "884025", // ABBA - Dancing Queen
		modern: "2387373015", // Doja Cat - Paint The Town Red
		holiday: "24136731", // Brenda Lee - Rockin' Around The Christmas Tree
	},
	"2026-12-29": {
		oldies: "487484142", // Earth, Wind & Fire - September
		modern: "2525537871", // Dua Lipa - Houdini
		holiday: "7163389", // John Lennon & Yoko Ono - Happy Xmas (War Is Over)
	},
	"2026-12-30": {
		oldies: "88845911", // Tears For Fears - Everybody Wants To Rule The World
		modern: "2801558052", // Billie Eilish - BIRDS OF A FEATHER
		holiday: "7372854", // Chuck Berry - Run Rudolph Run
	},
	"2026-12-31": {
		oldies: "139902529", // Frank Sinatra - New York, New York
		modern: "2299840635", // Dua Lipa - Dance The Night
		holiday: "4601779", // Jackson 5 - Santa Claus Is Coming To Town
	},
};

function getActiveCategoryKeys(dateKey: string): CategoryKey[] {
	const baseKeys = [...BASE_CATEGORY_KEYS];
	if (isHolidaySeason(dateKey)) {
		return [HOLIDAY_CATEGORY, ...baseKeys];
	}
	return baseKeys;
}

app.get("/api/", (c) => c.json({ name: "Cloudflare" }));

app.get("/api/music/search", async (c) => {
	const query = c.req.query("q");
	if (!query) {
		return jsonError("Missing query parameter", 400);
	}

	try {
		const deezerResponse = await fetch(
			`https://api.deezer.com/search/track?${new URLSearchParams({
				q: query,
				limit: "20",
			}).toString()}`,
		);

		if (!deezerResponse.ok) {
			return jsonError("Deezer search failed", deezerResponse.status);
		}

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const data = (await deezerResponse.json()) as any;
		const tracks =
			data?.data
				?.map((item: any) => mapDeezerTrack(item))
				.filter((track: { name?: string | null }) => (track?.name ? !isAlternateVersion(track.name) : true)) ?? [];

		return c.json({ tracks });
	} catch (error) {
		console.error("Deezer search error", error);
		return jsonError("Unable to reach Deezer", 500);
	}
});

app.get("/api/music/weekly", async (c) => {
	try {
		const requestedDate = c.req.query("date");
		const fallbackDate = getEasternDateKey();
		const dateKey = requestedDate
			? isKnownScheduleDate(requestedDate)
				? requestedDate
				: fallbackDate
			: getCurrentWeeklyScheduleDateKey();
		const activeCategoryKeys = getActiveCategoryKeys(dateKey);
		const scheduleEntry = WEEKLY_TRACK_SCHEDULE[dateKey];
		const trackIds: Partial<Record<CategoryKey, string>> = {};
		for (const category of activeCategoryKeys) {
			trackIds[category] = scheduleEntry?.[category] ?? CATEGORY_DEFAULT_TRACKS[category];
		}

		const categoryEntries = await Promise.all(
			activeCategoryKeys.map(async (category) => {
				const id = trackIds[category];
				if (!id) {
					console.error(`Missing track id for category ${category} on ${dateKey}`);
					return [category, null] as const;
				}
				try {
					const track = await fetchDeezerTrack(id);
					return [category, track] as const;
				} catch (error) {
					console.error(`Weekly track error for ${category}`, error);
					return [category, null] as const;
				}
			}),
		);

		const categoryTracks = Object.fromEntries(categoryEntries) as Partial<Record<CategoryKey, ReturnType<typeof mapDeezerTrack> | null>>;
		const primaryTrack = categoryTracks.modern ?? categoryTracks.oldies;

		if (!primaryTrack) {
			return jsonError("Unable to load the weekly track", 502);
		}

		return c.json({
			track: primaryTrack,
			categories: categoryTracks,
			requestedDate: dateKey,
		});
	} catch (error) {
		console.error("Weekly track error", error);
		return jsonError("Unable to load the weekly track", 500);
	}
});

app.get("/api/music/archive", (c) => {
	return c.json({
		dates: getArchiveDates(),
	});
});

export default app;

function jsonError(message: string, status: number) {
	return new Response(JSON.stringify({ error: message }), {
		status,
		headers: {
			"content-type": "application/json",
		},
	});
}

function getEasternDateKey() {
	const now = new Date();
	return getEasternDateKeyFromDate(now);
}

function getEasternDateKeyFromDate(value: Date) {
	const formatter = new Intl.DateTimeFormat("en-US", {
		timeZone: "America/New_York",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	});
	const parts = formatter.format(value).split("/");
	const [month, day, year] = parts;
	return `${year}-${month}-${day}`;
}

function getCurrentWeeklyScheduleDateKey() {
	const now = new Date();
	const easternNow = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
	const startOfWeek = new Date(easternNow);
	startOfWeek.setHours(0, 0, 0, 0);
	startOfWeek.setDate(easternNow.getDate() - easternNow.getDay());
	const weekDateKey = getEasternDateKeyFromDate(startOfWeek);
	return isKnownScheduleDate(weekDateKey) ? weekDateKey : getEasternDateKey();
}

function isHolidaySeason(dateKey: string) {
	const [, monthStr, dayStr] = dateKey.split("-");
	const month = Number(monthStr);
	const day = Number(dayStr);
	if (Number.isNaN(month) || Number.isNaN(day)) {
		return false;
	}
	return month === 12 || (month === 1 && day === 1);
}

function isKnownScheduleDate(dateKey: string) {
	return Object.prototype.hasOwnProperty.call(WEEKLY_TRACK_SCHEDULE, dateKey);
}

function getArchiveDates() {
	return Object.keys(WEEKLY_TRACK_SCHEDULE).sort();
}

function isAlternateVersion(title: string) {
	const lower = title.toLowerCase();
	const keywordPatterns = [
		"(live",
		"live version",
		"acoustic",
		"karaoke",
		"instrumental",
		"edit",
		"remix",
		"mix)",
		"mix ",
		"cover",
		"demo",
		"version",
		"wedding",
		"extended",
	];

	if (/\(([^)]*remix|live|acoustic|version|edit|karaoke|instrumental|demo|cover|extended)[^)]*\)/i.test(title)) {
		return true;
	}

	return keywordPatterns.some((keyword) => lower.includes(keyword));
}

async function fetchDeezerTrack(trackId: string) {
	const response = await fetch(`https://api.deezer.com/track/${trackId}`);
	if (!response.ok) {
		throw new Error(`Failed to fetch track ${trackId} (${response.status})`);
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const data = (await response.json()) as any;
	return mapDeezerTrack(data);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDeezerTrack(item: any) {
	return {
		id: item.id,
		name: item.title ?? item.title_short ?? "",
		artists: item.artist?.name ?? "",
		album: item.album?.title ?? "",
		artwork: item.album?.cover_medium ?? item.album?.cover ?? null,
		previewUrl: item.preview ?? null,
		duration: item.duration ?? null,
		provider: "deezer",
		url: item.link ?? null,
	};
}
