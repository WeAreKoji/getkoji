// Demo profiles for Discovery page testing/presentation
// These are realistic sample profiles that don't require database entries

export interface DemoProfile {
  id: string;
  display_name: string;
  age: number;
  city: string;
  bio: string;
  gender: 'female' | 'male';
  intent: 'open_to_dating' | 'make_friends' | 'support_creators';
  photos: { id: string; photo_url: string; order_index: number }[];
  interests: string[];
  is_creator: boolean;
  subscription_price?: number;
}

export const demoFemaleProfiles: DemoProfile[] = [
  {
    id: 'demo-001',
    display_name: 'Sofia Martinez',
    age: 24,
    city: 'Miami',
    bio: 'Beach lover 🌊 Always planning my next adventure. Coffee first, questions later ☕',
    gender: 'female',
    intent: 'open_to_dating',
    photos: [
      { id: 'p1', photo_url: 'https://randomuser.me/api/portraits/women/1.jpg', order_index: 0 },
      { id: 'p2', photo_url: 'https://randomuser.me/api/portraits/women/65.jpg', order_index: 1 }
    ],
    interests: ['Travel', 'Coffee', 'Swimming'],
    is_creator: false
  },
  {
    id: 'demo-002',
    display_name: 'Emma Thompson',
    age: 27,
    city: 'New York',
    bio: 'Marketing by day, wine enthusiast by night. Dog mom to a golden retriever named Max 🐕',
    gender: 'female',
    intent: 'open_to_dating',
    photos: [
      { id: 'p3', photo_url: 'https://randomuser.me/api/portraits/women/2.jpg', order_index: 0 },
      { id: 'p4', photo_url: 'https://randomuser.me/api/portraits/women/66.jpg', order_index: 1 }
    ],
    interests: ['Wine Tasting', 'Photography', 'Travel'],
    is_creator: false
  },
  {
    id: 'demo-003',
    display_name: 'Mia Chen',
    age: 23,
    city: 'San Francisco',
    bio: 'Tech startup life 💻 Love hiking on weekends. Ask me about my sourdough obsession!',
    gender: 'female',
    intent: 'open_to_dating',
    photos: [
      { id: 'p5', photo_url: 'https://randomuser.me/api/portraits/women/3.jpg', order_index: 0 },
      { id: 'p6', photo_url: 'https://randomuser.me/api/portraits/women/68.jpg', order_index: 1 }
    ],
    interests: ['Technology', 'Hiking', 'Cooking'],
    is_creator: false
  },
  {
    id: 'demo-004',
    display_name: 'Olivia Williams',
    age: 29,
    city: 'Los Angeles',
    bio: 'Yoga instructor 🧘‍♀️ Passionate about wellness and good vibes. Let\'s grab smoothies!',
    gender: 'female',
    intent: 'open_to_dating',
    photos: [
      { id: 'p7', photo_url: 'https://randomuser.me/api/portraits/women/4.jpg', order_index: 0 },
      { id: 'p8', photo_url: 'https://randomuser.me/api/portraits/women/69.jpg', order_index: 1 }
    ],
    interests: ['Yoga', 'Fitness', 'Meditation'],
    is_creator: true,
    subscription_price: 9.99
  },
  {
    id: 'demo-005',
    display_name: 'Luna Garcia',
    age: 26,
    city: 'Austin',
    bio: 'Live music is my love language 🎸 Taco Tuesday enthusiast. Looking for concert buddies!',
    gender: 'female',
    intent: 'make_friends',
    photos: [
      { id: 'p9', photo_url: 'https://randomuser.me/api/portraits/women/5.jpg', order_index: 0 },
      { id: 'p10', photo_url: 'https://randomuser.me/api/portraits/women/71.jpg', order_index: 1 }
    ],
    interests: ['Indie Music', 'Karaoke', 'Street Food'],
    is_creator: false
  },
  {
    id: 'demo-006',
    display_name: 'Isabella Rodriguez',
    age: 31,
    city: 'Chicago',
    bio: 'Architecture nerd 🏛️ Weekend brunch is sacred. Currently learning Italian!',
    gender: 'female',
    intent: 'open_to_dating',
    photos: [
      { id: 'p11', photo_url: 'https://randomuser.me/api/portraits/women/6.jpg', order_index: 0 },
      { id: 'p12', photo_url: 'https://randomuser.me/api/portraits/women/72.jpg', order_index: 1 }
    ],
    interests: ['Art', 'Fine Dining', 'Reading'],
    is_creator: false
  },
  {
    id: 'demo-007',
    display_name: 'Ava Johnson',
    age: 22,
    city: 'Seattle',
    bio: 'Coffee snob ☕ Rainy days are the best days. Currently reading way too many books!',
    gender: 'female',
    intent: 'open_to_dating',
    photos: [
      { id: 'p13', photo_url: 'https://randomuser.me/api/portraits/women/7.jpg', order_index: 0 },
      { id: 'p14', photo_url: 'https://randomuser.me/api/portraits/women/74.jpg', order_index: 1 }
    ],
    interests: ['Reading', 'Coffee', 'Writing'],
    is_creator: false
  },
  {
    id: 'demo-008',
    display_name: 'Charlotte Brown',
    age: 28,
    city: 'Denver',
    bio: 'Mountain girl at heart 🏔️ Snowboarding in winter, hiking in summer. Adventure awaits!',
    gender: 'female',
    intent: 'open_to_dating',
    photos: [
      { id: 'p15', photo_url: 'https://randomuser.me/api/portraits/women/8.jpg', order_index: 0 },
      { id: 'p16', photo_url: 'https://randomuser.me/api/portraits/women/75.jpg', order_index: 1 }
    ],
    interests: ['Hiking', 'Travel', 'Rock Climbing'],
    is_creator: false
  },
  {
    id: 'demo-009',
    display_name: 'Amelia Davis',
    age: 25,
    city: 'Portland',
    bio: 'Plant mom 🌿 Vintage thrift store hunter. Let\'s explore farmers markets together!',
    gender: 'female',
    intent: 'make_friends',
    photos: [
      { id: 'p17', photo_url: 'https://randomuser.me/api/portraits/women/9.jpg', order_index: 0 },
      { id: 'p18', photo_url: 'https://randomuser.me/api/portraits/women/77.jpg', order_index: 1 }
    ],
    interests: ['Gardening', 'Sustainability', 'Minimalism'],
    is_creator: false
  },
  {
    id: 'demo-010',
    display_name: 'Harper Wilson',
    age: 30,
    city: 'Nashville',
    bio: 'Singer-songwriter 🎤 Love a good honky tonk night. Hot chicken is life!',
    gender: 'female',
    intent: 'open_to_dating',
    photos: [
      { id: 'p19', photo_url: 'https://randomuser.me/api/portraits/women/10.jpg', order_index: 0 },
      { id: 'p20', photo_url: 'https://randomuser.me/api/portraits/women/78.jpg', order_index: 1 }
    ],
    interests: ['Country Music', 'Karaoke', 'Street Food'],
    is_creator: true,
    subscription_price: 14.99
  },
  {
    id: 'demo-011',
    display_name: 'Evelyn Moore',
    age: 33,
    city: 'Boston',
    bio: 'History buff 📚 Love exploring old bookstores. Looking for someone to debate politics with!',
    gender: 'female',
    intent: 'open_to_dating',
    photos: [
      { id: 'p21', photo_url: 'https://randomuser.me/api/portraits/women/11.jpg', order_index: 0 },
      { id: 'p22', photo_url: 'https://randomuser.me/api/portraits/women/80.jpg', order_index: 1 }
    ],
    interests: ['Reading', 'Podcasts', 'Writing'],
    is_creator: false
  },
  {
    id: 'demo-012',
    display_name: 'Abigail Taylor',
    age: 21,
    city: 'Phoenix',
    bio: 'College senior 🎓 Desert sunset chaser. Future veterinarian!',
    gender: 'female',
    intent: 'make_friends',
    photos: [
      { id: 'p23', photo_url: 'https://randomuser.me/api/portraits/women/12.jpg', order_index: 0 },
      { id: 'p24', photo_url: 'https://randomuser.me/api/portraits/women/81.jpg', order_index: 1 }
    ],
    interests: ['Hiking', 'Reading', 'Self Improvement'],
    is_creator: false
  },
  {
    id: 'demo-013',
    display_name: 'Emily Anderson',
    age: 27,
    city: 'San Diego',
    bio: 'Beach volleyball player 🏐 Sunset surfer. Tacos are a food group!',
    gender: 'female',
    intent: 'open_to_dating',
    photos: [
      { id: 'p25', photo_url: 'https://randomuser.me/api/portraits/women/13.jpg', order_index: 0 },
      { id: 'p26', photo_url: 'https://randomuser.me/api/portraits/women/82.jpg', order_index: 1 }
    ],
    interests: ['Swimming', 'Street Food', 'Fitness'],
    is_creator: false
  },
  {
    id: 'demo-014',
    display_name: 'Elizabeth Thomas',
    age: 35,
    city: 'Philadelphia',
    bio: 'Lawyer by day, foodie by night 🍝 Weekend trips to NYC are my thing!',
    gender: 'female',
    intent: 'open_to_dating',
    photos: [
      { id: 'p27', photo_url: 'https://randomuser.me/api/portraits/women/14.jpg', order_index: 0 },
      { id: 'p28', photo_url: 'https://randomuser.me/api/portraits/women/84.jpg', order_index: 1 }
    ],
    interests: ['Fine Dining', 'Travel', 'Reading'],
    is_creator: false
  },
  {
    id: 'demo-015',
    display_name: 'Mila Jackson',
    age: 24,
    city: 'Atlanta',
    bio: 'Dance teacher 💃 Soul food enthusiast. Always down for karaoke!',
    gender: 'female',
    intent: 'open_to_dating',
    photos: [
      { id: 'p29', photo_url: 'https://randomuser.me/api/portraits/women/15.jpg', order_index: 0 },
      { id: 'p30', photo_url: 'https://randomuser.me/api/portraits/women/85.jpg', order_index: 1 }
    ],
    interests: ['Dance', 'Karaoke', 'Street Food'],
    is_creator: false
  },
  {
    id: 'demo-016',
    display_name: 'Ella White',
    age: 26,
    city: 'Minneapolis',
    bio: 'Graphic designer 🎨 Love a good art museum. Prince fan forever 💜',
    gender: 'female',
    intent: 'make_friends',
    photos: [
      { id: 'p31', photo_url: 'https://randomuser.me/api/portraits/women/16.jpg', order_index: 0 },
      { id: 'p32', photo_url: 'https://randomuser.me/api/portraits/women/87.jpg', order_index: 1 }
    ],
    interests: ['Art', 'Interior Design', 'Electronic Music'],
    is_creator: false
  },
  {
    id: 'demo-017',
    display_name: 'Avery Harris',
    age: 29,
    city: 'Dallas',
    bio: 'BBQ judge 🍖 Yes, that\'s a real thing! Football Sundays are sacred.',
    gender: 'female',
    intent: 'open_to_dating',
    photos: [
      { id: 'p33', photo_url: 'https://randomuser.me/api/portraits/women/17.jpg', order_index: 0 },
      { id: 'p34', photo_url: 'https://randomuser.me/api/portraits/women/88.jpg', order_index: 1 }
    ],
    interests: ['Street Food', 'Gaming', 'Soccer'],
    is_creator: false
  },
  {
    id: 'demo-018',
    display_name: 'Scarlett Martin',
    age: 23,
    city: 'New Orleans',
    bio: 'Jazz lover 🎺 Beignets are my weakness. Let\'s get lost in the French Quarter!',
    gender: 'female',
    intent: 'open_to_dating',
    photos: [
      { id: 'p35', photo_url: 'https://randomuser.me/api/portraits/women/18.jpg', order_index: 0 },
      { id: 'p36', photo_url: 'https://randomuser.me/api/portraits/women/89.jpg', order_index: 1 }
    ],
    interests: ['Jazz', 'Street Food', 'Travel'],
    is_creator: false
  },
  {
    id: 'demo-019',
    display_name: 'Grace Lee',
    age: 32,
    city: 'Honolulu',
    bio: 'Island life 🌺 Surfing at sunrise, poi bowls for lunch. Aloha spirit!',
    gender: 'female',
    intent: 'open_to_dating',
    photos: [
      { id: 'p37', photo_url: 'https://randomuser.me/api/portraits/women/19.jpg', order_index: 0 },
      { id: 'p38', photo_url: 'https://randomuser.me/api/portraits/women/91.jpg', order_index: 1 }
    ],
    interests: ['Swimming', 'Travel', 'Yoga'],
    is_creator: true,
    subscription_price: 12.99
  },
  {
    id: 'demo-020',
    display_name: 'Chloe Martinez',
    age: 25,
    city: 'Las Vegas',
    bio: 'Event planner 🎉 Not a gambler, just love the energy! Best brunches in town.',
    gender: 'female',
    intent: 'make_friends',
    photos: [
      { id: 'p39', photo_url: 'https://randomuser.me/api/portraits/women/20.jpg', order_index: 0 },
      { id: 'p40', photo_url: 'https://randomuser.me/api/portraits/women/92.jpg', order_index: 1 }
    ],
    interests: ['Fine Dining', 'Coffee', 'Fashion'],
    is_creator: false
  },
  {
    id: 'demo-021',
    display_name: 'Zoey Clark',
    age: 28,
    city: 'Orlando',
    bio: 'Theme park enthusiast 🎢 Annual pass holder. Disney adult and proud!',
    gender: 'female',
    intent: 'open_to_dating',
    photos: [
      { id: 'p41', photo_url: 'https://randomuser.me/api/portraits/women/21.jpg', order_index: 0 },
      { id: 'p42', photo_url: 'https://randomuser.me/api/portraits/women/93.jpg', order_index: 1 }
    ],
    interests: ['Movies', 'Gaming', 'Travel'],
    is_creator: false
  },
  {
    id: 'demo-022',
    display_name: 'Penelope Lewis',
    age: 34,
    city: 'Washington DC',
    bio: 'Policy wonk 🏛️ Weekend museum hopper. Looking for someone to watch C-SPAN with (kidding... mostly)',
    gender: 'female',
    intent: 'open_to_dating',
    photos: [
      { id: 'p43', photo_url: 'https://randomuser.me/api/portraits/women/22.jpg', order_index: 0 },
      { id: 'p44', photo_url: 'https://randomuser.me/api/portraits/women/95.jpg', order_index: 1 }
    ],
    interests: ['Reading', 'Art', 'Podcasts'],
    is_creator: false
  },
  {
    id: 'demo-023',
    display_name: 'Riley Robinson',
    age: 22,
    city: 'Baltimore',
    bio: 'Med student 🩺 Crab cakes are my comfort food. Need someone to help me destress!',
    gender: 'female',
    intent: 'open_to_dating',
    photos: [
      { id: 'p45', photo_url: 'https://randomuser.me/api/portraits/women/23.jpg', order_index: 0 },
      { id: 'p46', photo_url: 'https://randomuser.me/api/portraits/women/96.jpg', order_index: 1 }
    ],
    interests: ['Reading', 'Street Food', 'Meditation'],
    is_creator: false
  },
  {
    id: 'demo-024',
    display_name: 'Layla Walker',
    age: 27,
    city: 'Detroit',
    bio: 'Auto industry engineer 🚗 Motown music lover. Building the future of transportation!',
    gender: 'female',
    intent: 'make_friends',
    photos: [
      { id: 'p47', photo_url: 'https://randomuser.me/api/portraits/women/24.jpg', order_index: 0 },
      { id: 'p48', photo_url: 'https://randomuser.me/api/portraits/women/97.jpg', order_index: 1 }
    ],
    interests: ['Technology', 'Hip Hop', 'Jazz'],
    is_creator: false
  },
  {
    id: 'demo-025',
    display_name: 'Nora Hall',
    age: 30,
    city: 'Cleveland',
    bio: 'Sports fanatic ⚾ Rock and Roll Hall of Fame regular. Midwest nice is real!',
    gender: 'female',
    intent: 'open_to_dating',
    photos: [
      { id: 'p49', photo_url: 'https://randomuser.me/api/portraits/women/25.jpg', order_index: 0 },
      { id: 'p50', photo_url: 'https://randomuser.me/api/portraits/women/30.jpg', order_index: 1 }
    ],
    interests: ['Basketball', 'Hip Hop', 'Gaming'],
    is_creator: false
  },
  {
    id: 'demo-026',
    display_name: 'Lily Young',
    age: 26,
    city: 'Pittsburgh',
    bio: 'Nurse 💉 Pierogi enthusiast. Steelers fan through thick and thin!',
    gender: 'female',
    intent: 'open_to_dating',
    photos: [
      { id: 'p51', photo_url: 'https://randomuser.me/api/portraits/women/26.jpg', order_index: 0 },
      { id: 'p52', photo_url: 'https://randomuser.me/api/portraits/women/31.jpg', order_index: 1 }
    ],
    interests: ['Fitness', 'Street Food', 'Soccer'],
    is_creator: false
  },
  {
    id: 'demo-027',
    display_name: 'Eleanor King',
    age: 29,
    city: 'Kansas City',
    bio: 'BBQ capital = best life 🍖 Jazz history nerd. Fountains everywhere!',
    gender: 'female',
    intent: 'open_to_dating',
    photos: [
      { id: 'p53', photo_url: 'https://randomuser.me/api/portraits/women/27.jpg', order_index: 0 },
      { id: 'p54', photo_url: 'https://randomuser.me/api/portraits/women/32.jpg', order_index: 1 }
    ],
    interests: ['Street Food', 'Jazz', 'Fine Dining'],
    is_creator: false
  },
  {
    id: 'demo-028',
    display_name: 'Hannah Wright',
    age: 24,
    city: 'St. Louis',
    bio: 'Architect 🏗️ Gateway Arch enthusiast. Cardinals forever!',
    gender: 'female',
    intent: 'make_friends',
    photos: [
      { id: 'p55', photo_url: 'https://randomuser.me/api/portraits/women/28.jpg', order_index: 0 },
      { id: 'p56', photo_url: 'https://randomuser.me/api/portraits/women/34.jpg', order_index: 1 }
    ],
    interests: ['Art', 'Basketball', 'Interior Design'],
    is_creator: false
  },
  {
    id: 'demo-029',
    display_name: 'Addison Scott',
    age: 31,
    city: 'Milwaukee',
    bio: 'Craft beer connoisseur 🍺 Cheese curds are a way of life. Lakefront vibes!',
    gender: 'female',
    intent: 'open_to_dating',
    photos: [
      { id: 'p57', photo_url: 'https://randomuser.me/api/portraits/women/35.jpg', order_index: 0 },
      { id: 'p58', photo_url: 'https://randomuser.me/api/portraits/women/36.jpg', order_index: 1 }
    ],
    interests: ['Craft Beer', 'Street Food', 'Hiking'],
    is_creator: false
  },
  {
    id: 'demo-030',
    display_name: 'Aubrey Green',
    age: 23,
    city: 'Indianapolis',
    bio: 'Racing fan 🏎️ Pork tenderloin sandwich defender. Hoosier hospitality!',
    gender: 'female',
    intent: 'open_to_dating',
    photos: [
      { id: 'p59', photo_url: 'https://randomuser.me/api/portraits/women/37.jpg', order_index: 0 },
      { id: 'p60', photo_url: 'https://randomuser.me/api/portraits/women/38.jpg', order_index: 1 }
    ],
    interests: ['Gaming', 'Street Food', 'Travel'],
    is_creator: false
  },
  {
    id: 'demo-031',
    display_name: 'Stella Baker',
    age: 28,
    city: 'Columbus',
    bio: 'Ohio State alum 🏈 Buckeye for life! Coffee shop hopper.',
    gender: 'female',
    intent: 'open_to_dating',
    photos: [
      { id: 'p61', photo_url: 'https://randomuser.me/api/portraits/women/40.jpg', order_index: 0 },
      { id: 'p62', photo_url: 'https://randomuser.me/api/portraits/women/41.jpg', order_index: 1 }
    ],
    interests: ['Soccer', 'Coffee', 'Gaming'],
    is_creator: false
  },
  {
    id: 'demo-032',
    display_name: 'Natalie Adams',
    age: 35,
    city: 'Tampa',
    bio: 'Beach reads and sunshine ☀️ Cigar City Brewing fan. Cuban sandwiches!',
    gender: 'female',
    intent: 'make_friends',
    photos: [
      { id: 'p63', photo_url: 'https://randomuser.me/api/portraits/women/42.jpg', order_index: 0 },
      { id: 'p64', photo_url: 'https://randomuser.me/api/portraits/women/43.jpg', order_index: 1 }
    ],
    interests: ['Swimming', 'Reading', 'Craft Beer'],
    is_creator: false
  },
  {
    id: 'demo-033',
    display_name: 'Leah Nelson',
    age: 26,
    city: 'Raleigh',
    bio: 'Tech recruiter 💼 Research Triangle represent! BBQ debate settler.',
    gender: 'female',
    intent: 'open_to_dating',
    photos: [
      { id: 'p65', photo_url: 'https://randomuser.me/api/portraits/women/44.jpg', order_index: 0 },
      { id: 'p66', photo_url: 'https://randomuser.me/api/portraits/women/45.jpg', order_index: 1 }
    ],
    interests: ['Technology', 'Street Food', 'Entrepreneurship'],
    is_creator: false
  },
  {
    id: 'demo-034',
    display_name: 'Savannah Hill',
    age: 22,
    city: 'Charleston',
    bio: 'Southern charm 🌸 History lover. Best sweet tea in the South!',
    gender: 'female',
    intent: 'open_to_dating',
    photos: [
      { id: 'p67', photo_url: 'https://randomuser.me/api/portraits/women/47.jpg', order_index: 0 },
      { id: 'p68', photo_url: 'https://randomuser.me/api/portraits/women/48.jpg', order_index: 1 }
    ],
    interests: ['Reading', 'Travel', 'Fashion'],
    is_creator: false
  },
  {
    id: 'demo-035',
    display_name: 'Audrey Ramirez',
    age: 30,
    city: 'San Antonio',
    bio: 'Alamo city native 🤠 River Walk regular. Fiesta every day!',
    gender: 'female',
    intent: 'open_to_dating',
    photos: [
      { id: 'p69', photo_url: 'https://randomuser.me/api/portraits/women/49.jpg', order_index: 0 },
      { id: 'p70', photo_url: 'https://randomuser.me/api/portraits/women/50.jpg', order_index: 1 }
    ],
    interests: ['Travel', 'Street Food', 'Dance'],
    is_creator: true,
    subscription_price: 7.99
  },
  {
    id: 'demo-036',
    display_name: 'Brooklyn Campbell',
    age: 25,
    city: 'Salt Lake City',
    bio: 'Outdoor adventurer ⛷️ Best powder in the country! Also into rock climbing.',
    gender: 'female',
    intent: 'make_friends',
    photos: [
      { id: 'p71', photo_url: 'https://randomuser.me/api/portraits/women/51.jpg', order_index: 0 },
      { id: 'p72', photo_url: 'https://randomuser.me/api/portraits/women/52.jpg', order_index: 1 }
    ],
    interests: ['Rock Climbing', 'Hiking', 'Fitness'],
    is_creator: false
  },
  {
    id: 'demo-037',
    display_name: 'Bella Mitchell',
    age: 27,
    city: 'Tucson',
    bio: 'Desert stargazer ✨ Saguaro lover. Best sunsets in Arizona!',
    gender: 'female',
    intent: 'open_to_dating',
    photos: [
      { id: 'p73', photo_url: 'https://randomuser.me/api/portraits/women/54.jpg', order_index: 0 },
      { id: 'p74', photo_url: 'https://randomuser.me/api/portraits/women/55.jpg', order_index: 1 }
    ],
    interests: ['Photography', 'Hiking', 'Travel'],
    is_creator: false
  },
  {
    id: 'demo-038',
    display_name: 'Claire Roberts',
    age: 33,
    city: 'Sacramento',
    bio: 'State capitol insider 🏛️ Farm-to-fork foodie. Wine country weekends!',
    gender: 'female',
    intent: 'open_to_dating',
    photos: [
      { id: 'p75', photo_url: 'https://randomuser.me/api/portraits/women/56.jpg', order_index: 0 },
      { id: 'p76', photo_url: 'https://randomuser.me/api/portraits/women/57.jpg', order_index: 1 }
    ],
    interests: ['Fine Dining', 'Wine Tasting', 'Cooking'],
    is_creator: false
  },
  {
    id: 'demo-039',
    display_name: 'Skylar Turner',
    age: 24,
    city: 'Albuquerque',
    bio: 'Breaking Bad tour guide (just kidding) 🌶️ Green chile on everything!',
    gender: 'female',
    intent: 'open_to_dating',
    photos: [
      { id: 'p77', photo_url: 'https://randomuser.me/api/portraits/women/58.jpg', order_index: 0 },
      { id: 'p78', photo_url: 'https://randomuser.me/api/portraits/women/59.jpg', order_index: 1 }
    ],
    interests: ['TV Series', 'Street Food', 'Travel'],
    is_creator: false
  },
  {
    id: 'demo-040',
    display_name: 'Lucy Phillips',
    age: 29,
    city: 'Boise',
    bio: 'Outdoor enthusiast 🏕️ Potato jokes welcome. Hidden gem of the PNW!',
    gender: 'female',
    intent: 'make_friends',
    photos: [
      { id: 'p79', photo_url: 'https://randomuser.me/api/portraits/women/61.jpg', order_index: 0 },
      { id: 'p80', photo_url: 'https://randomuser.me/api/portraits/women/62.jpg', order_index: 1 }
    ],
    interests: ['Hiking', 'Photography', 'Fitness'],
    is_creator: false
  },
  {
    id: 'demo-041',
    display_name: 'Anna Evans',
    age: 26,
    city: 'Richmond',
    bio: 'History teacher 📖 Civil War battlefields are my thing. Craft brewery hopper!',
    gender: 'female',
    intent: 'open_to_dating',
    photos: [
      { id: 'p81', photo_url: 'https://randomuser.me/api/portraits/women/63.jpg', order_index: 0 },
      { id: 'p82', photo_url: 'https://randomuser.me/api/portraits/women/64.jpg', order_index: 1 }
    ],
    interests: ['Reading', 'Craft Beer', 'Travel'],
    is_creator: false
  },
  {
    id: 'demo-042',
    display_name: 'Caroline Edwards',
    age: 31,
    city: 'Louisville',
    bio: 'Derby day is sacred 🐴 Bourbon trail explorer. Southern hospitality!',
    gender: 'female',
    intent: 'open_to_dating',
    photos: [
      { id: 'p83', photo_url: 'https://randomuser.me/api/portraits/women/98.jpg', order_index: 0 },
      { id: 'p84', photo_url: 'https://randomuser.me/api/portraits/women/99.jpg', order_index: 1 }
    ],
    interests: ['Wine Tasting', 'Travel', 'Fashion'],
    is_creator: false
  },
  {
    id: 'demo-043',
    display_name: 'Genesis Collins',
    age: 23,
    city: 'Memphis',
    bio: 'Blues lover 🎵 Beale Street regular. BBQ rivalry? Bring it on!',
    gender: 'female',
    intent: 'open_to_dating',
    photos: [
      { id: 'p85', photo_url: 'https://randomuser.me/api/portraits/women/33.jpg', order_index: 0 },
      { id: 'p86', photo_url: 'https://randomuser.me/api/portraits/women/39.jpg', order_index: 1 }
    ],
    interests: ['Jazz', 'Hip Hop', 'Street Food'],
    is_creator: false
  },
  {
    id: 'demo-044',
    display_name: 'Aaliyah Stewart',
    age: 28,
    city: 'Oklahoma City',
    bio: 'Thunder up! ⛈️ Tornado chaser (safely). Best chicken-fried steak!',
    gender: 'female',
    intent: 'make_friends',
    photos: [
      { id: 'p87', photo_url: 'https://randomuser.me/api/portraits/women/46.jpg', order_index: 0 },
      { id: 'p88', photo_url: 'https://randomuser.me/api/portraits/women/53.jpg', order_index: 1 }
    ],
    interests: ['Basketball', 'Street Food', 'Travel'],
    is_creator: false
  },
  {
    id: 'demo-045',
    display_name: 'Kennedy Morris',
    age: 30,
    city: 'Little Rock',
    bio: 'Natural State explorer 🌲 Hot springs weekends. Southern charm!',
    gender: 'female',
    intent: 'open_to_dating',
    photos: [
      { id: 'p89', photo_url: 'https://randomuser.me/api/portraits/women/60.jpg', order_index: 0 },
      { id: 'p90', photo_url: 'https://randomuser.me/api/portraits/women/67.jpg', order_index: 1 }
    ],
    interests: ['Hiking', 'Travel', 'Meditation'],
    is_creator: false
  },
  {
    id: 'demo-046',
    display_name: 'Maya Rogers',
    age: 25,
    city: 'Jacksonville',
    bio: 'Beach life 🏖️ Jaguars fan! Best shrimp and grits around.',
    gender: 'female',
    intent: 'open_to_dating',
    photos: [
      { id: 'p91', photo_url: 'https://randomuser.me/api/portraits/women/70.jpg', order_index: 0 },
      { id: 'p92', photo_url: 'https://randomuser.me/api/portraits/women/73.jpg', order_index: 1 }
    ],
    interests: ['Swimming', 'Soccer', 'Street Food'],
    is_creator: false
  },
  {
    id: 'demo-047',
    display_name: 'Willow Reed',
    age: 27,
    city: 'Savannah',
    bio: 'Southern belle 🌺 Historic district walks. Best Spanish moss views!',
    gender: 'female',
    intent: 'open_to_dating',
    photos: [
      { id: 'p93', photo_url: 'https://randomuser.me/api/portraits/women/76.jpg', order_index: 0 },
      { id: 'p94', photo_url: 'https://randomuser.me/api/portraits/women/79.jpg', order_index: 1 }
    ],
    interests: ['Reading', 'Fashion', 'Photography'],
    is_creator: true,
    subscription_price: 11.99
  },
  {
    id: 'demo-048',
    display_name: 'Kinsley Cook',
    age: 34,
    city: 'Hartford',
    bio: 'Insurance capital represent! 📊 Fall foliage chaser. Pizza debates welcome.',
    gender: 'female',
    intent: 'make_friends',
    photos: [
      { id: 'p95', photo_url: 'https://randomuser.me/api/portraits/women/83.jpg', order_index: 0 },
      { id: 'p96', photo_url: 'https://randomuser.me/api/portraits/women/86.jpg', order_index: 1 }
    ],
    interests: ['Travel', 'Street Food', 'Hiking'],
    is_creator: false
  },
  {
    id: 'demo-049',
    display_name: 'Naomi Morgan',
    age: 26,
    city: 'Providence',
    bio: 'RISD grad 🎨 Smallest state, biggest personality! Coffee milk lover.',
    gender: 'female',
    intent: 'open_to_dating',
    photos: [
      { id: 'p97', photo_url: 'https://randomuser.me/api/portraits/women/90.jpg', order_index: 0 },
      { id: 'p98', photo_url: 'https://randomuser.me/api/portraits/women/94.jpg', order_index: 1 }
    ],
    interests: ['Art', 'Interior Design', 'Coffee'],
    is_creator: false
  },
  {
    id: 'demo-050',
    display_name: 'Aria Bell',
    age: 29,
    city: 'Burlington',
    bio: 'Vermont vibes 🍁 Maple syrup connoisseur. Best fall colors!',
    gender: 'female',
    intent: 'open_to_dating',
    photos: [
      { id: 'p99', photo_url: 'https://randomuser.me/api/portraits/women/0.jpg', order_index: 0 },
      { id: 'p100', photo_url: 'https://randomuser.me/api/portraits/women/29.jpg', order_index: 1 }
    ],
    interests: ['Hiking', 'Cooking', 'Travel'],
    is_creator: false
  }
];

// Helper function to get all demo profiles
export const getAllDemoProfiles = (): DemoProfile[] => {
  return demoFemaleProfiles;
};

// Helper function to get demo profiles by gender
export const getDemoProfilesByGender = (gender: 'female' | 'male'): DemoProfile[] => {
  return demoFemaleProfiles.filter(p => p.gender === gender);
};

// Scalability note: This file can easily be expanded to include:
// - 100+ female profiles
// - 100+ male profiles
// - No performance issues since it's static data with pagination in the UI
// - Each profile loads ~2KB, so 200 profiles = ~400KB which is acceptable
