import type { MigrationInterface, QueryRunner } from 'typeorm';

type Section = { heading: string; paragraphs: string[] };

/**
 * Bản tiếng Anh cho blog: ba cột `_en`, một CHECK "đủ cả ba hoặc trống cả ba",
 * rồi điền bản dịch cho 11 bài của bộ seed hiện tại.
 *
 * Bản dịch bám theo thân bài **đang nằm trong database** (đối chiếu với seed
 * ngày 2026-09-13: khớp cả 11 bài). Dữ liệu viết thẳng trong file này chứ không
 * import từ `seeders/data/` — xem mục "Kho mẫu và migration" trong `CLAUDE.md`;
 * bản trùng ở `blog-posts-en.seed.ts` là có chủ đích.
 *
 * Chỉ ghi vào hàng còn `title_en IS NULL`: bản dịch là nội dung CMS làm chủ,
 * bài nào admin đã tự dịch trước khi migration này chạy thì giữ nguyên.
 */
function sectionsToDoc(sections: Section[]) {
  return {
    type: 'doc',
    content: sections.flatMap((section) => [
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: section.heading }],
      },
      ...section.paragraphs.map((text) => ({
        type: 'paragraph',
        content: [{ type: 'text', text }],
      })),
    ]),
  };
}

const POSTS: {
  slug: string;
  title: string;
  excerpt: string;
  body: Section[];
}[] = [
  {
    slug: 'nghi-thuc-le-cuoi-o-nha-gai',
    title:
      'Wedding rituals at the bride’s family home: the full sequence, from dạm ngõ to lại mặt',
    excerpt:
      'Four ceremonies, each with its own purpose. Know the order and nobody has to stand around on the day waiting for an elder to prompt them.',
    body: [
      {
        heading: 'Dạm ngõ — a conversation, not a ceremony',
        paragraphs: [
          'Dạm ngõ is the first time the two families formally sit down together. The group is small: grandparents, parents, siblings and a few close relatives. The groom’s family brings modest gifts — betel and areca, tea, cigarettes, sweets — which are placed on the bride’s family altar with incense before both sides settle the dates for the engagement and the wedding.',
          'This is the ceremony most likely to be overdone. At heart it is a meeting to agree on a calendar, so anything beyond a warm family meal only makes things harder for both households. When the families live far apart, many now combine dạm ngõ with the engagement — nothing wrong with that, as long as the bride’s family is told in advance so they can prepare.',
          'Settle these before the meeting ends: the engagement date, the wedding date, the number of gift trays, and who will speak for each family. Everyone remembers to ask about the first three; the fourth is usually forgotten and gets passed back and forth on the engagement day itself.',
        ],
      },
      {
        heading: 'Ăn hỏi — the busiest ceremony, and the easiest to derail',
        paragraphs: [
          'The groom’s tray bearers line up at the gate until the bride’s family invites them in, then carry the trays to the altar. A representative of the groom’s family speaks and presents the gifts; a representative of the bride’s family replies. The two teams of bearers exchange red envelopes — the families should agree on the amount beforehand so neither side feels awkward.',
          'After the gifts comes the couple’s part: greeting both families, pouring tea for the elders, and lighting incense together at the bride’s ancestral altar. It ends with confirming the wedding date and time, photos, and an informal family meal. Before the groom’s family leaves, the bride’s family performs lại quả — returning a portion of the gifts for them to take home.',
          'One convention worth remembering: the returned gifts are torn by hand, never cut with a knife or scissors. The elders will remind you, but knowing in advance saves an awkward moment.',
        ],
      },
      {
        heading:
          'Vu quy — the bride’s family’s own ceremony on the wedding day',
        paragraphs: [
          'On the morning of the wedding, the groom’s family comes to ask for the bride. Usually one relative goes ahead carrying a tray to announce that the procession is ready — a short step, but don’t skip it: it gives the bride’s family time to get everyone seated.',
          'The procession enters, the families greet each other, and the bride is brought out. The couple light incense at the bride’s ancestral altar, listen to her parents’ advice, and receive dowry gifts if the family has prepared any. Only then does the groom’s family ask permission to take the bride home.',
          'In the North and the Centre, by custom the bride’s parents do not travel with the procession to the groom’s home. In the South they do. This is where families from different regions misunderstand each other most often, so ask about it at dạm ngõ.',
        ],
      },
      {
        heading: 'Lại mặt — the most often skipped ceremony, and the easiest',
        paragraphs: [
          'After the wedding, the newlyweds visit the bride’s family. Tradition says the third day, but most families now fit it around the couple’s time off. The gifts are simple: a rooster, sticky rice, or just sweets and a bottle of wine.',
          'It is the only ceremony in the series with no required ritual. Its value lies elsewhere: after a wedding during which the bride’s mother barely sat down, this is the first meal where the whole family can actually talk.',
        ],
      },
      {
        heading:
          'Where to write this sequence down so the whole family can see it',
        paragraphs: [
          'The sequence above has to be repeated several times: for the tray bearers, for relatives who live far away, and for the couple themselves. The simplest way is to add each ceremony’s time to the schedule block of your online wedding invitation, along with the address and map for each venue.',
          'Guests open the link and see where to be and when, without anyone messaging them one by one. Keep the private rituals between the two families separate — the invitation is what goes out to everyone else.',
        ],
      },
    ],
  },
  {
    slug: 'nghi-thuc-le-cuoi-o-nha-trai',
    title:
      'Wedding rituals at the groom’s family home: bringing the bride home and the ancestral ceremony',
    excerpt:
      'Once the procession reaches the gate, the groom’s family takes over. Who lights the incense, who is greeted first, what goes on the altar — it varies by region.',
    body: [
      {
        heading: 'The bridal procession: who goes, and how',
        paragraphs: [
          'The procession is led by a respected elder of the groom’s family, usually called the chủ hôn. Then come the groom, the bride, and relatives and friends from both sides. The wedding cars are the groom’s family’s responsibility; settle the number of cars and the departure time at least a week ahead, since they have to match the time both families agreed on.',
          'A small note for whoever is holding the camera: the moment the bride steps out of her family’s gate is the hardest shot of the day to get again, because it happens once and no one wants to re-enact it.',
        ],
      },
      {
        heading: 'The ancestral ceremony at the groom’s home',
        paragraphs: [
          'On arrival, the couple are led before the altar. The groom’s father, or another male representative of the family, lights incense and announces the marriage to the ancestors. The couple then pay their respects, bow to the groom’s parents, and pour tea for the paternal relatives.',
          'The basic offerings are the same everywhere: incense, candles, tea, wine and phu thê cakes. The differences are in the details. The North sets out a five-fruit tray with lilies or gladioli. The Centre leans towards sweet cakes and avoids savoury dishes. The South has dragon-and-phoenix trays and a pair of candles carved with a dragon and a phoenix — brought by the groom’s family at the engagement, and lighting them is the most solemn part of the ceremony.',
          'If the families come from different regions, follow the customs of the family hosting that ceremony and tell the other side in advance. Mixing both sets of offerings usually produces a tray that looks like neither, and leaves the elders on both sides feeling something is missing.',
        ],
      },
      {
        heading: 'What to wear',
        paragraphs: [
          'At the engagement, áo dài is the safe choice for both. On the wedding day, the bride usually wears áo dài for the ancestral ceremony and changes into a wedding gown for the reception — bowing before an altar in a full ball gown is hard work.',
          'The groom wears a suit or áo dài, as long as it matches the bride’s level of formality. That sounds obvious, but a great many wedding photos suggest otherwise.',
        ],
      },
      {
        heading: 'Meeting the paternal relatives',
        paragraphs: [
          'The last part is serving tea and receiving gifts from the groom’s relatives. For the bride, this means remembering the names and family titles of a lot of people in very little time.',
          'A practical tip: ask the groom to write a short list in seating order — eldest uncle, second uncle, youngest aunt — and look it over the night before. It is ten minutes well spent, because relatives remember for a long time either way: use the right title and you’ll be praised all through the meal; use the wrong one and it becomes a story retold for years.',
        ],
      },
    ],
  },
  {
    slug: 'phong-tuc-cuoi-hoi-mien-bac',
    title:
      'Northern Vietnamese wedding customs: three main ceremonies and the conventions people keep asking about',
    excerpt:
      'Dạm ngõ, ăn hỏi, the wedding — plus lại mặt. An odd number of trays, an even number of gifts, and why.',
    body: [
      {
        heading: 'Three ceremonies, in strict order',
        paragraphs: [
          'Weddings in the North come down to three ceremonies: dạm ngõ, ăn hỏi and the wedding itself. Lại mặt is a fourth, but it happens after the wedding, so it usually isn’t counted as part of the preparations.',
          'Dạm ngõ is the formal request for the couple to see each other, kept within the family. Ăn hỏi is the engagement — larger, with gift trays. The wedding is the day the bride is brought home. The engagement and the wedding can be weeks or months apart, and some families hold them on consecutive days.',
        ],
      },
      {
        heading: 'An odd number of trays, an even number of gifts inside',
        paragraphs: [
          'In the North, trays are counted in odd numbers: 5, 7, 9 or 11. But the items inside each tray come in even numbers. This convention confuses first-timers; the easy way to remember it is that odd counts the trays guests can see, and even counts what sits inside each one.',
          'The number of trays doesn’t reflect a family’s wealth; it reflects what the two families agreed. The most courteous approach is for the bride’s family to name the number they’d like at dạm ngõ, so the groom’s family doesn’t have to guess — and so neither side ends up comparing with some acquaintance’s wedding.',
          'Alongside the trays there is usually an envelope of bride-price money, the amount named by the bride’s family or agreed between both. There is no common standard for it, so don’t use another wedding’s figure as a benchmark.',
        ],
      },
      {
        heading: 'Dates, times and cưới lấy ngày',
        paragraphs: [
          'The date and time of the procession are chosen by the groom’s family, usually after consulting the calendar. If the bride’s age that year is considered unlucky, some families hold a cưới lấy ngày — a small ceremony within the year to secure the date, with the main celebration the following year.',
          'This is a custom, not a rule. Many Northern families today skip it entirely. What matters is that the couple know which side cares about it, so they can raise it early rather than discover it after the invitations are printed.',
        ],
      },
      {
        heading: 'Lại mặt after three days',
        paragraphs: [
          'Northern tradition has the couple bring gifts to the bride’s family three days after the wedding. The offering is modest: rice, a live chicken, an envelope. It tells the bride’s family that all is well.',
          'These days distance makes the three-day mark hard to keep. Visiting later is not disrespectful; not visiting at all is what the bride’s family remembers.',
        ],
      },
    ],
  },
  {
    slug: 'phong-tuc-cuoi-hoi-mien-nam',
    title:
      'Southern Vietnamese wedding customs: six traditional ceremonies and today’s shorter version',
    excerpt:
      'Giáp lời, đính hôn, lên đèn, phản bái. Which ones are still kept, and which most families now combine.',
    body: [
      {
        heading: 'Six ceremonies on paper, three in practice',
        paragraphs: [
          'The traditional Southern sequence is giáp lời, thông gia, cầu thân, đính hôn (the engagement), the wedding and phản bái. In practice most families now keep three: giáp lời (the equivalent of dạm ngõ), the engagement and the wedding.',
          'Thông gia — the bride’s family visiting the groom’s to see how they live — and cầu thân have mostly been folded into giáp lời. Phản bái is often done on the wedding day itself, or dropped. Knowing the full list still helps: when an elder mentions a ceremony by name, you’ll know what they mean.',
        ],
      },
      {
        heading: 'Trays counted in even numbers',
        paragraphs: [
          'Unlike the North, the South counts gift trays in even numbers — usually 6 or 8 — because even numbers stand for pairs. The trays are covered with red silk or wrapped in red or gold cellophane.',
          'The tray bearers on both sides are young and unmarried. The pairs facing each other during the ceremony are often matched on purpose by the families, so choosing bearers is something to ask about, not just a matter of filling slots.',
        ],
      },
      {
        heading: 'Lên đèn — the signature ritual',
        paragraphs: [
          'At the engagement at the bride’s home, the groom’s family brings a pair of large candles carved with a dragon and a phoenix. Both families light them together on the bride’s ancestral altar. It is the most solemn moment of the day.',
          'The candles must fit the candle holders on the bride’s family altar. It sounds trivial, but it is the most common mishap of the ritual: candles too big or too small for the holders, and nobody notices until it’s time to light them. Measure a week ahead and it’s solved.',
        ],
      },
      {
        heading: 'Choosing a date, and common taboos',
        paragraphs: [
          'Many Southern families check the bride’s lunar age and avoid years considered Kim Lâu, as well as the 3rd, 7th and 12th lunar months.',
          'These are optional customs. If the two families disagree, the smoothest approach isn’t to argue about who’s right but to ask the side that cares more whether another date would work — there usually is one, and that settles it.',
        ],
      },
      {
        heading: 'The atmosphere',
        paragraphs: [
          'The clearest difference from the North isn’t the number of trays or the offerings, but the pace. Southern ceremonies have fewer rigid rituals, elders talk more freely, and the bride’s parents travel with the procession to the groom’s home.',
          'If you come from different regions, let the other family know. A Northern groom’s family is sometimes surprised to see the bride’s parents get into the wedding car, simply because nobody does that back home.',
        ],
      },
    ],
  },
  {
    slug: 'dam-cuoi-mien-tay',
    title:
      'Mekong Delta weddings: coconut-leaf gates, processions by boat and a feast for the whole village',
    excerpt:
      'The same ceremonies as the rest of the South, organised in a way that belongs to the river country.',
    body: [
      {
        heading: 'Southern ceremonies, done a different way',
        paragraphs: [
          'Weddings in the Mekong Delta follow the Southern sequence: giáp lời, thông gia, cầu thân, the engagement, the wedding and phản bái. What sets them apart is how they are organised, not the rituals.',
          'In many places a wedding isn’t just the business of two families but of the whole neighbourhood. Neighbours come days early to help put up the marquee, cook and serve. That directly affects invitations: the number of people who turn up usually far exceeds the number of invitations sent.',
        ],
      },
      {
        heading: 'A wedding marquee built from what’s at hand',
        paragraphs: [
          'The gate is made from banana trunks, coconut leaves and bamboo, woven by hand in the front yard. Plenty of city couples now order this style as a concept, but in the Delta it was always the natural choice: the materials grow around the house, and everyone in the village knows how to weave them.',
          'If you want this kind of gate, remember that fresh coconut leaves only look their best for about a day. Build it too early and by the big day the leaves will have wilted and faded.',
        ],
      },
      {
        heading: 'Bringing the bride home by boat',
        paragraphs: [
          'Where both homes sit along canals, the procession travels by boat, decorated with flowers and balloons. It is the signature image of a Mekong Delta wedding, and the part that needs the most careful preparation.',
          'Three things to plan: when the tide rises and falls, how an áo dài and a wedding gown get on and off a boat, and where the photographer will stand. This scene happens once and can’t be repeated.',
        ],
      },
      {
        heading: 'Food and music',
        paragraphs: [
          'The feast is usually served at home, runs long, and isn’t portioned like a restaurant banquet. Live music — đờn ca tài tử folk songs or a karaoke set — is practically a given.',
          'For guests travelling from afar, what they need to know in advance isn’t when the feast starts but how to get there: many Delta addresses are hard to find on a map. Adding a Google Maps link to the exact pin in your online invitation heads off almost every call asking for directions that morning.',
        ],
      },
    ],
  },
  {
    slug: 'ruoc-dau-mot-lan-hay-hai-lan',
    title:
      'Bringing the bride home once or twice: what’s the difference, and when is it needed?',
    excerpt:
      'Two processions don’t mean two weddings. Understand it properly so you can discuss it with your families without it turning into an argument.',
    body: [
      {
        heading: 'Where the difference lies',
        paragraphs: [
          'A single procession: the groom’s party goes to the bride’s home, holds the ceremony and brings the bride to her husband’s home, where she stays from then on. This is the most common way today.',
          'Two processions: the first is usually combined with the engagement or a small ceremony; the bride goes to the groom’s home for the ritual, then returns to her parents’ house. Only on the official wedding day is she brought home a second time, and this time she stays.',
        ],
      },
      {
        heading: 'Why some families do it twice',
        paragraphs: [
          'The most common reason is a belief about age: when the bride’s age that year is considered unlucky, some families believe that leaving home twice wards off misfortune. It is folk belief with no common standard, and practice differs even within the same province.',
          'There is a more practical reason that often gets mistaken for a spiritual one: the two families live very far apart. Many then combine the engagement and the procession on the same day so relatives only make the journey once. Each place has its own name for this, so when an elder says “let’s just do it once”, ask what exactly is being combined with what.',
        ],
      },
      {
        heading: 'If the two families don’t agree',
        paragraphs: [
          'This is one of the most tense topics in wedding preparations, because it touches on belief rather than budget. Arguing about who’s right almost never gets anywhere.',
          'An easier way: ask the side that cares about it what absolutely has to happen — the list is usually much shorter than you’d expect. Trade the rest for the other side’s comfort.',
        ],
      },
      {
        heading: 'What it means for your invitations',
        paragraphs: [
          'If you hold two processions, guests only attend the second — the first is a family matter. Put the date and time of the event guests are invited to on the invitation, and don’t list both, or people won’t know which day they’re invited.',
          'Online invitations make this easier than paper ones: you can give close relatives the full schedule and everyone else a shorter one, using the same design and changing only the schedule block.',
        ],
      },
    ],
  },
  {
    slug: 'dam-ngo-mac-gi',
    title:
      'What to wear to dạm ngõ: ideas for the bride, the groom and both sets of parents',
    excerpt:
      'The first meeting of the two families. Dress respectfully, but no more formally than the occasion calls for.',
    body: [
      {
        heading: 'The general rule: one step below the engagement',
        paragraphs: [
          'Dạm ngõ is a conversation at home, not a ceremony with guests. Clothing should be neat and respectful — exactly one step less formal than the engagement.',
          'Dressing too formally backfires: when the family is sitting down to tea and the bride appears in a sequinned áo dài, the warmth disappears. Dressing too casually tells the other side you don’t take the meeting seriously.',
        ],
      },
      {
        heading: 'The bride',
        paragraphs: [
          'The safest choice is a simply cut áo dài in a soft colour — white, pastel pink, pale blue. A modern áo dài in silk or brocade also works, as long as the embellishment is restrained.',
          'A dress or a smart two-piece is fine if both families are relaxed about it; just keep it modest and not too short. One small note: you’ll be sitting for a long time and there will be group photos, so choose something that doesn’t crease.',
        ],
      },
      {
        heading: 'The groom',
        paragraphs: [
          'A men’s áo dài if the bride is wearing áo dài — the two of you should match in formality. Otherwise, a white or light-blue shirt with dark trousers is enough.',
          'There’s no need for a full suit. A suit at dạm ngõ makes the groom look like he’s off to a job interview, and if it’s hot the jacket will be coming off within fifteen minutes.',
        ],
      },
      {
        heading: 'Both sets of parents',
        paragraphs: [
          'Mothers usually choose an áo dài with a subtle pattern, a shift dress, or a jacket with a long skirt. Fathers usually wear a shirt and trousers, perhaps with a light jacket.',
          'One thing few families do but should: let your mother know what the other family plans to wear. Not to coordinate, but to avoid one side in a formal áo dài and the other in an everyday shirt — whoever is dressed more simply will feel self-conscious the whole time.',
        ],
      },
      {
        heading: 'Dressing for the season and the setting',
        paragraphs: [
          'Dạm ngõ usually takes place indoors, with a lot of sitting, an altar and incense. Breathable, crease-resistant fabrics matter more than a beautiful cut.',
          'Summers in both the North and the South are hot and humid, so avoid stuffy fabrics. In winter, make sure the outer layer can come off and still leave you looking neat, because it will be warmer inside than out.',
        ],
      },
    ],
  },
  {
    slug: 'skincare-truoc-ngay-cuoi',
    title:
      'Skincare before your wedding: a timeline that keeps your foundation from caking',
    excerpt:
      'A flawless base is decided by your skin, not the powder. The work starts months before, not that morning.',
    body: [
      {
        heading: 'Three months out: time to test, not to switch',
        paragraphs: [
          'The most important rule of pre-wedding skincare is that anything new must be tested early. Skin needs time to react, and a new product can take weeks to show that it doesn’t suit you.',
          'This is also a sensible point to start treatments that need several sessions. The one thing you absolutely shouldn’t do in the final week is try anything for the first time — even a face mask everyone raves about.',
        ],
      },
      {
        heading: 'The daily routine, in the right order',
        paragraphs: [
          'Cleanse: wash with lukewarm water and a cleanser that suits your skin. Exfoliate once or twice a week, no more — over-scrubbed skin gets thinner and burns more easily.',
          'Tone and treat: toner after cleansing, while the skin is still slightly damp. Then a serum chosen for your skin’s specific concern, followed by moisturiser. The neck, lips and eye area need care at the same time as the face, because these are the three places cameras see most clearly and people most often forget.',
          'Sunscreen: the last step every morning, even on days you barely go out. If you can keep only one step of the whole routine, keep this one.',
        ],
      },
      {
        heading: 'The final week and the wedding morning',
        paragraphs: [
          'In the final week, keep everything the same, sleep enough and drink enough water. Use a hydrating mask you already know one or two days before — not right before, because plumped-up skin can make foundation slide off faster.',
          'That morning: a gentle cleanse, toner, a thin layer of moisturiser, and let it absorb completely before the makeup artist starts. Moisturiser that hasn’t sunk in is the most common reason foundation cakes after a few hours.',
          'A facial mist once the makeup is finished helps the base hold through a long day. And however late you get home, take it off — heavy bridal foundation left on overnight almost always costs you a few days of breakouts.',
        ],
      },
      {
        heading: 'Common mistakes',
        paragraphs: [
          'Using too many products at once out of impatience. Skin doesn’t improve faster with more steps, but the risk of irritation goes up.',
          'Skipping sunscreen during outdoor pre-wedding photo shoots, then trying to cover the tanned patches with heavier foundation on the day.',
          'Overhauling your skincare routine in the final week on a friend’s advice. The time to experiment was three months ago, not now.',
        ],
      },
    ],
  },
  {
    slug: 'xac-dinh-loai-da-truoc-khi-makeup',
    title: 'Identifying your skin type before bridal makeup',
    excerpt:
      'Oily, dry or combination skin decides which primer to use and how long your foundation lasts. Here are three ways to check at home.',
    body: [
      {
        heading: 'Five skin types',
        paragraphs: [
          'Normal skin: a smooth surface, neither shiny nor tight after washing. Dry skin: feels rough, has small pores, and flakes slightly on the cheeks.',
          'Oily skin: produces a lot of oil, has large pores, and looks shiny within a few hours. Combination skin: oily in the T-zone (forehead, nose, chin) but dry on the cheeks — the most common type in Vietnam’s climate. Sensitive skin: reddens easily and itches or stings when you change products or the weather changes.',
        ],
      },
      {
        heading: 'Three ways to check',
        paragraphs: [
          'Look at your bare skin: wash your face, apply nothing, wait about an hour, then look in the mirror in natural light. It’s the simplest method, and also the easiest to misread.',
          'Use blotting paper: after washing and letting your skin dry naturally, press blotting paper on your forehead, nose, chin and both cheeks and hold for about five minutes. Compare the oil from the T-zone with the cheeks and you have your answer — especially useful for telling oily skin from combination skin.',
          'Get a skin analysis at a spa or dermatology clinic. It’s the most accurate option, and the only one that shows what’s happening beneath the surface.',
        ],
      },
      {
        heading: 'What each skin type needs for makeup',
        paragraphs: [
          'Oily skin: use an oil-control primer, set the base with loose powder, and carry blotting paper on the wedding day. Don’t add powder over an oily area without blotting it first — that’s the fastest way to make foundation cake.',
          'Dry skin: focus on moisturising before makeup, choose a liquid foundation over pressed powder, and go easy on powder where skin tends to flake.',
          'Combination skin: treat the two zones differently — control oil in the T-zone, hydrate the cheeks. Apply foundation from top to bottom, following the direction of the fine facial hair, and avoid stiff brushes.',
          'Sensitive skin: patch-test products on a small area of the chin or behind the ear at least a week ahead. Keep the makeup light, and tell your makeup artist about your skin at the trial.',
        ],
      },
      {
        heading: 'The makeup trial',
        paragraphs: [
          'Book a trial at least two weeks before the wedding, and keep that makeup on all day to see how it wears after eight hours. That’s something an hour-long trial can’t tell you.',
          'Take a few photos on your own phone, both indoors and outdoors. A base that looks good under salon lights and a base that looks good in sunlight are two different things.',
        ],
      },
    ],
  },
  {
    slug: 'co-dau-can-thi-deo-kinh-hay-lens',
    title:
      'Short-sighted brides: glasses or contact lenses on the wedding day?',
    excerpt:
      'Either works. Which one depends on your prescription, how long the day is, and whether you’re used to wearing lenses.',
    body: [
      {
        heading:
          'Glasses: absolutely fine, and nothing to worry about aesthetically',
        paragraphs: [
          'A bride wearing glasses on her wedding day is perfectly normal. The advantages are clear: you see clearly all day, there’s nothing new to get used to, and it costs nothing extra.',
          'The drawbacks are real too: frames hide part of your eye makeup, short-sighted lenses make eyes look smaller in photos, and the glass catches the flash. All three can be handled if you know about them in advance.',
        ],
      },
      {
        heading: 'If you choose glasses: frames and makeup',
        paragraphs: [
          'Thin frames in a light colour or fine metal cut across the face less than thick ones. If you can, get anti-reflective lenses just for the wedding — this makes the biggest difference in photos.',
          'For makeup: slightly bolder eyeliner than usual, thicker mascara and more defined brows to make up for what the lenses shrink. Tell your makeup artist you’ll be wearing glasses, and bring them to the trial.',
        ],
      },
      {
        heading: 'If you choose contact lenses',
        paragraphs: [
          'Lenses keep things neat for makeup and photos, but you need to get used to them first. Try them several times, for longer each time, starting at least two weeks before the wedding. A wedding day can run for well over ten hours, and eyes that aren’t used to lenses will be dry and red before the reception starts.',
          'Put your lenses in before your makeup, never the other way round. Bring eye drops and a spare pair of glasses — if your eyes can’t last until the end of the day, you still have a fallback.',
          'On coloured lenses: brown, grey or soft pink tones look more natural in photos. The more unusual the colour, the more likely it is to clash with your makeup and your dress.',
        ],
      },
      {
        heading: 'What many brides choose',
        paragraphs: [
          'A popular middle ground: lenses for the ceremony and photos, then glasses for the evening reception once your eyes are tired.',
          'If you go this way, leave your glasses and lens solution in the changing room and give them to a bridesmaid to look after. On the day, you won’t remember where you put them.',
        ],
      },
    ],
  },
  {
    slug: 'loi-cam-on-sau-dam-cuoi',
    title:
      'Thank-you messages after the wedding: who to send them to, when, and what to write',
    excerpt:
      'Once the wedding is over the big jobs are done, but one small task is easy to forget — and remembered for a long time.',
    body: [
      {
        heading: 'Who to thank',
        paragraphs: [
          'Four groups, and each needs a different tone. Guests who came to the reception. Parents and relatives on both sides — the group who did the most work and are least often thanked out loud. Friends who helped, from carrying trays to running errands. And people far away who couldn’t come but still sent a gift or good wishes.',
          'An easily forgotten fifth group: the vendors who did their part well. A sincere thank-you here often comes back later as help for your friends.',
        ],
      },
      {
        heading: 'When to send them',
        paragraphs: [
          'Within a week of the reception. Any later and the thank-you loses its warmth and starts to sound like a duty ticked off a list.',
          'If you’re leaving on honeymoon straight after the wedding, write the messages before you go and send them as soon as you’re back. Don’t let them fall into the gap between the two.',
        ],
      },
      {
        heading: 'How a thank-you is structured',
        paragraphs: [
          'Three simple parts: acknowledge that the person came or helped, mention something specific the two of you remember, and close with a good wish or a promise to meet.',
          'The middle part is what matters. “Thank you for coming” is something anyone can write. “Thank you for catching the earliest bus to make it to the morning ceremony” is written for one person, and that’s what people keep.',
        ],
      },
      {
        heading: 'How to send them',
        paragraphs: [
          'For elders in the family: call, or say it in person during lại mặt. With this group, a text message comes across as careless.',
          'For friends and colleagues: a personal message still beats a public post by a long way. If there are many, a post with wedding photos is reasonable — but still message the people who helped you directly.',
          'For guests far away who sent gifts: a thank-you card with a wedding photo is what’s remembered longest, and a natural occasion to send them the photos once you get them from the photographer.',
        ],
      },
      {
        heading: 'Reuse your invitation link to say thank you',
        paragraphs: [
          'An online invitation link doesn’t stop being useful after the wedding. You can turn it into a thank-you message with photos from the day itself and send it back to the same guest list — no new list to build, and everyone who opens it sees the invitation they received before.',
          'The wishes guests wrote in the invitation’s guestbook are still there too. Reading them again before writing your thank-yous is the fastest way to remember who said what.',
        ],
      },
    ],
  },
];

export class AddBlogPostEnglish1789900000000 implements MigrationInterface {
  name = 'AddBlogPostEnglish1789900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "blog_posts" ADD "title_en" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "blog_posts" ADD "excerpt_en" character varying(500)`,
    );
    await queryRunner.query(`ALTER TABLE "blog_posts" ADD "body_en" jsonb`);
    await queryRunner.query(
      `ALTER TABLE "blog_posts" ADD CONSTRAINT "CHK_blog_posts_english_complete"
       CHECK (("title_en" IS NULL) = ("excerpt_en" IS NULL) AND ("title_en" IS NULL) = ("body_en" IS NULL))`,
    );

    for (const post of POSTS) {
      await queryRunner.query(
        `UPDATE "blog_posts"
         SET "title_en" = $1, "excerpt_en" = $2, "body_en" = $3::jsonb
         WHERE "slug" = $4 AND "title_en" IS NULL`,
        [
          post.title,
          post.excerpt,
          JSON.stringify(sectionsToDoc(post.body)),
          post.slug,
        ],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "blog_posts" DROP CONSTRAINT "CHK_blog_posts_english_complete"`,
    );
    await queryRunner.query(`ALTER TABLE "blog_posts" DROP COLUMN "body_en"`);
    await queryRunner.query(
      `ALTER TABLE "blog_posts" DROP COLUMN "excerpt_en"`,
    );
    await queryRunner.query(`ALTER TABLE "blog_posts" DROP COLUMN "title_en"`);
  }
}
