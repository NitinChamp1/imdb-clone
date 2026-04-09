/* ============================================================
   data.js — All mock movie/TV data for the IMDb Clone
   ============================================================ */

const MOVIES = [
  {
    id: 1, title: "The Shawshank Redemption", year: 1994, rating: 9.3,
    votes: "2.9M", genre: ["drama"], director: "Frank Darabont",
    cast: ["Tim Robbins", "Morgan Freeman", "Bob Gunton"],
    runtime: "2h 22m", pg: "R", description: "Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.",
    poster: "https://m.media-amazon.com/images/M/MV5BNDE3ODcxYzMtY2YzZC00NmNlLWJiNDMtZDViZWM2MzIxZDYwXkEyXkFqcGdeQXVyNjAwNDUxODI@._V1_SX300.jpg",
    backdrop: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1400&q=80",
    type: "movie", ranked: 1, trending: false, featured: true, fanFav: true
  },
  {
    id: 2, title: "The Godfather", year: 1972, rating: 9.2,
    votes: "2.1M", genre: ["drama", "thriller"], director: "Francis Ford Coppola",
    cast: ["Marlon Brando", "Al Pacino", "James Caan"],
    runtime: "2h 55m", pg: "R", description: "The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.",
    poster: "https://m.media-amazon.com/images/M/MV5BM2MyNjYxNmUtYTAwNi00MTYxLWJmNWYtYzZlODY3ZTk3OTFlXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_SX300.jpg",
    backdrop: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1400&q=80",
    type: "movie", ranked: 2, trending: true, featured: true, fanFav: true
  },
  {
    id: 3, title: "The Dark Knight", year: 2008, rating: 9.0,
    votes: "2.8M", genre: ["action", "thriller"], director: "Christopher Nolan",
    cast: ["Christian Bale", "Heath Ledger", "Aaron Eckhart"],
    runtime: "2h 32m", pg: "PG-13", description: "When the menace known as the Joker wreaks havoc on Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.",
    poster: "https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_SX300.jpg",
    backdrop: "https://images.unsplash.com/photo-1531259683007-016a7b628fc3?w=1400&q=80",
    type: "movie", ranked: 3, trending: true, featured: true, fanFav: false
  },
  {
    id: 4, title: "Pulp Fiction", year: 1994, rating: 8.9,
    votes: "2.2M", genre: ["thriller", "drama"], director: "Quentin Tarantino",
    cast: ["John Travolta", "Uma Thurman", "Samuel L. Jackson"],
    runtime: "2h 34m", pg: "R", description: "The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.",
    poster: "https://m.media-amazon.com/images/M/MV5BNGNhMDIzZTUtNTBlZi00MTRlLWFjM2ItYzViMjE3YzI5MjljXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_SX300.jpg",
    backdrop: "https://images.unsplash.com/photo-1570267688881-2ba25ed9f9d8?w=1400&q=80",
    type: "movie", ranked: 4, trending: false, featured: true, fanFav: true
  },
  {
    id: 5, title: "Schindler's List", year: 1993, rating: 9.0,
    votes: "1.5M", genre: ["drama"], director: "Steven Spielberg",
    cast: ["Liam Neeson", "Ralph Fiennes", "Ben Kingsley"],
    runtime: "3h 15m", pg: "R", description: "In German-occupied Poland during World War II, industrialist Oskar Schindler gradually becomes concerned for his Jewish workforce after witnessing their persecution by the Nazis.",
    poster: "https://m.media-amazon.com/images/M/MV5BNDE4OTY3MDctMjMwNi00NWZmLWE0MTQtNzdlOWU2NzQ4NWE4XkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_SX300.jpg",
    backdrop: "https://images.unsplash.com/photo-1560169897-fc0cdbdfa4d5?w=1400&q=80",
    type: "movie", ranked: 5, trending: false, featured: false, fanFav: true
  },
  {
    id: 6, title: "Inception", year: 2010, rating: 8.8,
    votes: "2.5M", genre: ["sci-fi", "action"], director: "Christopher Nolan",
    cast: ["Leonardo DiCaprio", "Joseph Gordon-Levitt", "Elliot Page"],
    runtime: "2h 28m", pg: "PG-13", description: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
    poster: "https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_SX300.jpg",
    backdrop: "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=1400&q=80",
    type: "movie", ranked: 6, trending: true, featured: true, fanFav: false
  },
  {
    id: 7, title: "Interstellar", year: 2014, rating: 8.7,
    votes: "2.1M", genre: ["sci-fi", "drama"], director: "Christopher Nolan",
    cast: ["Matthew McConaughey", "Anne Hathaway", "Jessica Chastain"],
    runtime: "2h 49m", pg: "PG-13", description: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
    poster: "https://m.media-amazon.com/images/M/MV5BZjdkOTU3MDktN2IxOS00OGEyLWFmMjktY2FiMmZkNWIyODZiXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_SX300.jpg",
    backdrop: "https://images.unsplash.com/photo-1446776709462-d6b525c57bd3?w=1400&q=80",
    type: "movie", ranked: 7, trending: true, featured: false, fanFav: true
  },
  {
    id: 8, title: "The Matrix", year: 1999, rating: 8.7,
    votes: "2.0M", genre: ["sci-fi", "action"], director: "Lana & Lilly Wachowski",
    cast: ["Keanu Reeves", "Laurence Fishburne", "Carrie-Anne Moss"],
    runtime: "2h 16m", pg: "R", description: "When a beautiful stranger leads computer hacker Neo to a forbidding underworld, he discovers the shocking truth--the life he knows is the elaborate deception of an evil cyber-intelligence.",
    poster: "https://m.media-amazon.com/images/M/MV5BNzQzOTk3OTAtNDQ0Zi00ZTVlLTM5YTUtZWU4M2ZhZmVlMWFiXkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_SX300.jpg",
    backdrop: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1400&q=80",
    type: "movie", ranked: 8, trending: false, featured: true, fanFav: false
  },
  {
    id: 9, title: "Goodfellas", year: 1990, rating: 8.7,
    votes: "1.2M", genre: ["thriller", "drama"], director: "Martin Scorsese",
    cast: ["Ray Liotta", "Robert De Niro", "Joe Pesci"],
    runtime: "2h 25m", pg: "R", description: "The story of Henry Hill and his life in the mob, covering his relationship with his wife Karen Hill and his mob partners.",
    poster: "https://m.media-amazon.com/images/M/MV5BY2NkZjEzMDgtN2RjYy00YzM1LWI4ZmQtMjIwYjFjNmI3ZGEwXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_SX300.jpg",
    backdrop: "https://images.unsplash.com/photo-1512070679279-8988d32161be?w=1400&q=80",
    type: "movie", ranked: 9, trending: false, featured: false, fanFav: false
  },
  {
    id: 10, title: "Fight Club", year: 1999, rating: 8.8,
    votes: "2.2M", genre: ["thriller", "drama"], director: "David Fincher",
    cast: ["Brad Pitt", "Edward Norton", "Helena Bonham Carter"],
    runtime: "2h 19m", pg: "R", description: "An insomniac office worker and a devil-may-care soap maker form an underground fight club that evolves into an anarchist organization.",
    poster: "https://m.media-amazon.com/images/M/MV5BOTgyOGQ1NDItNGU3Ny00MjU3LTg2YWEtNmEyYjBiMjI1Y2M5XkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_SX300.jpg",
    backdrop: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1400&q=80",
    type: "movie", ranked: 10, trending: true, featured: false, fanFav: false
  },
  {
    id: 11, title: "Avengers: Endgame", year: 2019, rating: 8.4,
    votes: "1.3M", genre: ["action", "sci-fi"], director: "Russo Brothers",
    cast: ["Robert Downey Jr.", "Chris Evans", "Scarlett Johansson"],
    runtime: "3h 1m", pg: "PG-13", description: "After the devastating events of Infinity War, the universe is in ruins. With help from remaining allies, the Avengers assemble once more in order to reverse Thanos' actions.",
    poster: "https://m.media-amazon.com/images/M/MV5BMTc5MDE2ODcwNV5BMl5BanBnXkFtZTgwMzI2NzQ2NzM@._V1_SX300.jpg",
    backdrop: "https://images.unsplash.com/photo-1635805737707-575885ab0820?w=1400&q=80",
    type: "movie", ranked: 11, trending: true, featured: true, fanFav: true
  },
  {
    id: 12, title: "Parasite", year: 2019, rating: 8.5,
    votes: "920K", genre: ["thriller", "drama"], director: "Bong Joon-ho",
    cast: ["Song Kang-ho", "Lee Sun-kyun", "Cho Yeo-jeong"],
    runtime: "2h 12m", pg: "R", description: "Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.",
    poster: "https://m.media-amazon.com/images/M/MV5BYWZjMjk3ZTItODQ2ZC00NTY5LWE0ZDYtZTI3MjcwN2Q5NTVkXkEyXkFqcGdeQXVyODk4OTc3MTY@._V1_SX300.jpg",
    backdrop: "https://images.unsplash.com/photo-1574267432553-4b4628081c31?w=1400&q=80",
    type: "movie", ranked: 12, trending: false, featured: true, fanFav: true
  },
  {
    id: 13, title: "The Lion King", year: 1994, rating: 8.5,
    votes: "1.1M", genre: ["drama", "comedy"], director: "Roger Allers & Rob Minkoff",
    cast: ["Matthew Broderick", "Jeremy Irons", "James Earl Jones"],
    runtime: "1h 28m", pg: "G", description: "Lion prince Simba and his father are targeted by his treacherous uncle, who wants to ascend the throne himself.",
    poster: "https://m.media-amazon.com/images/M/MV5BYTYxNGMyZTYtMjE3MS00MzNjLWFjNmYtMDk3N2FmM2JiM2M1XkEyXkFqcGdeQXVyNjY5NDU4NzI@._V1_SX300.jpg",
    backdrop: "https://images.unsplash.com/photo-1536152470836-b943b246224c?w=1400&q=80",
    type: "movie", ranked: 13, trending: false, featured: false, fanFav: true
  },
  {
    id: 14, title: "Bohemian Rhapsody", year: 2018, rating: 7.9,
    votes: "740K", genre: ["drama"], director: "Bryan Singer",
    cast: ["Rami Malek", "Lucy Boynton", "Gwilym Lee"],
    runtime: "2h 14m", pg: "PG-13", description: "The story of the legendary British rock band Queen and lead singer Freddie Mercury, leading up to their famous performance at Live Aid.",
    poster: "https://m.media-amazon.com/images/M/MV5BMjQxMDM5MjcwMl5BMl5BanBnXkFtZTgwNjk3MzM2NjM@._V1_SX300.jpg",
    backdrop: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=1400&q=80",
    type: "movie", ranked: 14, trending: false, featured: false, fanFav: false
  },
  {
    id: 15, title: "Get Out", year: 2017, rating: 7.7,
    votes: "640K", genre: ["thriller"], director: "Jordan Peele",
    cast: ["Daniel Kaluuya", "Allison Williams", "Bradley Whitford"],
    runtime: "1h 44m", pg: "R", description: "A Black man visits his white girlfriend's family estate, only to become increasingly disturbed by their behavior.",
    poster: "https://m.media-amazon.com/images/M/MV5BMjUxMDQwNjcyMl5BMl5BanBnXkFtZTgwNzcwMzc1MTI@._V1_SX300.jpg",
    backdrop: "https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=1400&q=80",
    type: "movie", ranked: 15, trending: false, featured: false, fanFav: false
  },
  {
    id: 16, title: "La La Land", year: 2016, rating: 8.0,
    votes: "760K", genre: ["drama", "comedy"], director: "Damien Chazelle",
    cast: ["Ryan Gosling", "Emma Stone", "John Legend"],
    runtime: "2h 8m", pg: "PG-13", description: "While navigating their careers in Los Angeles, a pianist and an actress fall in love while attempting to reconcile their aspirations for the future.",
    poster: "https://m.media-amazon.com/images/M/MV5BMzUzNDM2NzM2MV5BMl5BanBnXkFtZTgwNTM3NTg4OTE@._V1_SX300.jpg",
    backdrop: "https://images.unsplash.com/photo-1493957988430-a5f2e15f39a3?w=1400&q=80",
    type: "movie", ranked: 16, trending: false, featured: false, fanFav: false
  },
  {
    id: 17, title: "Spider-Man: No Way Home", year: 2021, rating: 8.3,
    votes: "870K", genre: ["action", "sci-fi"], director: "Jon Watts",
    cast: ["Tom Holland", "Zendaya", "Benedict Cumberbatch"],
    runtime: "2h 28m", pg: "PG-13", description: "With Spider-Man's identity now revealed, Peter asks Doctor Strange for help. When a spell goes wrong, dangerous foes from other worlds start to appear.",
    poster: "https://m.media-amazon.com/images/M/MV5BZWMyYzFjYTYtNTRjYi00OGExLWE2YzgtOGRmYjAxZTU3NzBiXkEyXkFqcGdeQXVyMzQ0MzA0NTM@._V1_SX300.jpg",
    backdrop: "https://images.unsplash.com/photo-1559163499-413811fb2344?w=1400&q=80",
    type: "movie", ranked: 17, trending: true, featured: true, fanFav: true
  },
  {
    id: 18, title: "Dune: Part Two", year: 2024, rating: 8.6,
    votes: "780K", genre: ["sci-fi", "action"], director: "Denis Villeneuve",
    cast: ["Timothée Chalamet", "Zendaya", "Austin Butler"],
    runtime: "2h 46m", pg: "PG-13", description: "Paul Atreides unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family.",
    poster: "https://m.media-amazon.com/images/M/MV5BN2QyZGU4ZDctOWMzMy00NTc5LThlOGQtOGYyNDMzNzcyMWQzXkEyXkFqcGdeQXVyMDM2NDM2MQ@@._V1_SX300.jpg",
    backdrop: "https://images.unsplash.com/photo-1436891620584-47fd0e565afb?w=1400&q=80",
    type: "movie", ranked: 18, trending: true, featured: true, fanFav: true
  },
  {
    id: 19, title: "Oppenheimer", year: 2023, rating: 8.3,
    votes: "910K", genre: ["drama", "sci-fi"], director: "Christopher Nolan",
    cast: ["Cillian Murphy", "Emily Blunt", "Robert Downey Jr."],
    runtime: "3h 0m", pg: "R", description: "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II.",
    poster: "https://m.media-amazon.com/images/M/MV5BMDBmYTZjNjUtN2M1MS00MTQ2LTk2ODgtNzc2M2QyZGE5NTVjXkEyXkFqcGdeQXVyNzAwMjU2MTY@._V1_SX300.jpg",
    backdrop: "https://images.unsplash.com/photo-1625766763788-95dcce9bf5ac?w=1400&q=80",
    type: "movie", ranked: 19, trending: true, featured: true, fanFav: true
  },
  {
    id: 20, title: "Barbie", year: 2023, rating: 6.9,
    votes: "530K", genre: ["comedy", "drama"], director: "Greta Gerwig",
    cast: ["Margot Robbie", "Ryan Gosling", "America Ferrera"],
    runtime: "1h 54m", pg: "PG-13", description: "Barbie and Ken are having the time of their lives in the colorful and seemingly perfect world of Barbie Land. When they get a chance to go to the real world, things get complicated.",
    poster: "https://m.media-amazon.com/images/M/MV5BNjU3N2QxNzYtMjk1NC00MTc4LTk1NTQtMmUxNTljM2I0NDA5XkEyXkFqcGdeQXVyODE5NzE3OTE@._V1_SX300.jpg",
    backdrop: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1400&q=80",
    type: "movie", ranked: 20, trending: false, featured: false, fanFav: false
  }
];

const TV_SHOWS = [
  {
    id: 101, title: "Breaking Bad", year: "2008–2013", rating: 9.5,
    votes: "2.2M", genre: ["drama", "thriller"],
    cast: ["Bryan Cranston", "Aaron Paul", "Anna Gunn"],
    seasons: 5, episodes: 62, status: "Ended",
    description: "A high school chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine to secure his family's future.",
    poster: "https://m.media-amazon.com/images/M/MV5BYmQ4YWMxYjUtNjZmYi00MDdmLWJjOTUtYjc1NjgwZjlhNjk3XkEyXkFqcGdeQXVyMTMzNDExODE5._V1_SX300.jpg",
    backdrop: "https://images.unsplash.com/photo-1628191136091-6c580dcb7f9a?w=1400&q=80",
    type: "tv", ranked: 1, trending: true, topTV: true
  },
  {
    id: 102, title: "Planet Earth II", year: 2016, rating: 9.5,
    votes: "148K", genre: ["drama"],
    cast: ["David Attenborough"],
    seasons: 1, episodes: 6, status: "Ended",
    description: "David Attenborough presents a documentary series exploring how animals meet the challenges of surviving in the most iconic habitats on Earth.",
    poster: "https://m.media-amazon.com/images/M/MV5BZWFlNjQyMjAtNDMxNi00Njk0LWJlZWMtOWM4ZDI5ZmMzNjkyXkEyXkFqcGdeQXVyNjI0MDg2NzE@._V1_SX300.jpg",
    backdrop: "https://images.unsplash.com/photo-1551085254-e96b210db58a?w=1400&q=80",
    type: "tv", ranked: 2, trending: false, topTV: true
  },
  {
    id: 103, title: "Game of Thrones", year: "2011–2019", rating: 9.2,
    votes: "2.3M", genre: ["drama", "action"],
    cast: ["Emilia Clarke", "Peter Dinklage", "Kit Harington"],
    seasons: 8, episodes: 73, status: "Ended",
    description: "Nine noble families fight for control over the mythical lands of Westeros, while an ancient enemy returns after being dormant for millennia.",
    poster: "https://m.media-amazon.com/images/M/MV5BYTRiNDQwYzAtMzVlZS00NTI5LWJjYjUtMzkwNTUzMWMxZTllXkEyXkFqcGdeQXVyNDIzMzcwNjc@._V1_SX300.jpg",
    backdrop: "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=1400&q=80",
    type: "tv", ranked: 3, trending: false, topTV: true
  },
  {
    id: 104, title: "Stranger Things", year: "2016–2025", rating: 8.7,
    votes: "1.3M", genre: ["drama", "sci-fi", "thriller"],
    cast: ["Millie Bobby Brown", "Finn Wolfhard", "Winona Ryder"],
    seasons: 5, episodes: 42, status: "Ongoing",
    description: "When a young boy disappears, his mother, a police chief and his friends must confront terrifying supernatural forces in order to get him back.",
    poster: "https://m.media-amazon.com/images/M/MV5BN2ZmYjg1YmEtNWQ4OC00YWM0LWE0ZDktYTkyMjVkNzJiZmJjXkEyXkFqcGdeQXVyMTkxNjUyNQ@@._V1_SX300.jpg",
    backdrop: "https://images.unsplash.com/photo-1574017974-4c50c6bab26b?w=1400&q=80",
    type: "tv", ranked: 4, trending: true, topTV: true
  },
  {
    id: 105, title: "The Wire", year: "2002–2008", rating: 9.3,
    votes: "428K", genre: ["drama", "thriller"],
    cast: ["Dominic West", "Lance Reddick", "Sonja Sohn"],
    seasons: 5, episodes: 60, status: "Ended",
    description: "The Baltimore drug scene, as seen through the eyes of drug dealers and law enforcement.",
    poster: "https://m.media-amazon.com/images/M/MV5BZmY5ZDMxM2ItODM4ZC00NWZmLTk5MDMtODgxYmQ1Y2QwZjE4XkEyXkFqcGdeQXVyNTA4NzY1MzY@._V1_SX300.jpg",
    backdrop: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1400&q=80",
    type: "tv", ranked: 5, trending: false, topTV: true
  },
  {
    id: 106, title: "The Last of Us", year: "2023–", rating: 8.8,
    votes: "620K", genre: ["drama", "sci-fi"],
    cast: ["Pedro Pascal", "Bella Ramsey", "Gabriel Luna"],
    seasons: 2, episodes: 19, status: "Ongoing",
    description: "After a global catastrophe, a hardened survivor takes charge of a 14-year-old girl who may be humanity's last hope.",
    poster: "https://m.media-amazon.com/images/M/MV5BZGUzYTI3M2EtZmM0Yy00NGUyLWI4ODEtN2Q3ZGJlYzhhZjU3XkEyXkFqcGdeQXVyNTM0OTY1OQ@@._V1_SX300.jpg",
    backdrop: "https://images.unsplash.com/photo-1493697821252-12cedd8afa3d?w=1400&q=80",
    type: "tv", ranked: 6, trending: true, topTV: true
  },
  {
    id: 107, title: "The Mandalorian", year: "2019–", rating: 8.7,
    votes: "680K", genre: ["action", "sci-fi"],
    cast: ["Pedro Pascal", "Giancarlo Esposito", "Carl Weathers"],
    seasons: 3, episodes: 24, status: "Ongoing",
    description: "The travels of a lone bounty hunter in the outer reaches of the galaxy, far from the authority of the New Republic.",
    poster: "https://m.media-amazon.com/images/M/MV5BN2M5YWYyMWEtNjhlOS00MjcyLWI1MDgtNTM0ZjI1OTY4YjdiXkEyXkFqcGdeQXVyNjg2NjQwMDQ@._V1_SX300.jpg",
    backdrop: "https://images.unsplash.com/photo-1446776709462-d6b525c57bd3?w=1400&q=80",
    type: "tv", ranked: 7, trending: true, topTV: false
  },
  {
    id: 108, title: "Succession", year: "2018–2023", rating: 8.8,
    votes: "498K", genre: ["drama", "comedy"],
    cast: ["Brian Cox", "Jeremy Strong", "Sarah Snook"],
    seasons: 4, episodes: 39, status: "Ended",
    description: "The Roy family is known for controlling the biggest media and entertainment company in the world. However, their world changes when the family patriarch begins to step down from the company.",
    poster: "https://m.media-amazon.com/images/M/MV5BYzQwOGMwZDItYmFkYy00ODczLTkxNDktOWI0N2UwYzVjNTMzXkEyXkFqcGdeQXVyNTA4NzY1MzY@._V1_SX300.jpg",
    backdrop: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1400&q=80",
    type: "tv", ranked: 8, trending: false, topTV: true
  }
];

// Hero movies for carousel
const HERO_MOVIES = [MOVIES[17], MOVIES[18], MOVIES[2], MOVIES[5]]; // Dune2, Oppenheimer, Dark Knight, Inception

// All content combined
const ALL_CONTENT = [...MOVIES, ...TV_SHOWS];
