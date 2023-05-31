var eventsMediator = {
    events: {},
    on: function (eventName, callbackfn) {
        this.events[eventName] = this.events[eventName]
            ? this.events[eventName]
            : [];
        this.events[eventName].push(callbackfn);
    },
    emit: function (eventName, data) {
        if (this.events[eventName]) {
            this.events[eventName].forEach(function (callBackfn) {
                callBackfn(data);
            });
        }
    },
};

var apiKey = "3b1dd1354c97059318eb7f74932a5430",
    apiReadAccessToken = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIzYjFkZDEzNTRjOTcwNTkzMThlYjdmNzQ5MzJhNTQzMCIsInN1YiI6IjY0Nzc0N2ZmODlkOTdmMDBhNThmNTY4ZCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.j3HYHh9oRgdyT9i0J2eqjQASQh7WXJG72WvY2Fa6u-U";

var moviesComponent = {
    currentMovies: [],
    currentPage: null,

    $dataRow: null,

    init: function () {
        eventsMediator.on("movies.loaded", this.render.bind(this));
        eventsMediator.on("pagination.prev", this.onPaginationPrev.bind(this));
        eventsMediator.on("pagination.next", this.onPaginationNext.bind(this));
        this.$dataRow = $("#movies-row-wrapper");
        this.currentPage = 1;
        this.fetchMoviePage();
    },

    onPaginationPrev: function () {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.fetchMoviePage();
        }
    },

    onPaginationNext: function () {
        this.currentPage++;
        this.fetchMoviePage();
    },

    fetchMoviePage: function () {
        $.ajax({
            url: `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&page=${this.currentPage}`,
            type: "GET",
            success: this.onMovies,
            dataType: "json"
        }).done(function (data) {
            eventsMediator.emit("movies.loaded", data);
        })
    },

    onMovies: function (data) {
        console.log(data);
    },

    render: function (data) {
        this.currentMovies = data.results;
        this.$dataRow.html('');
        for (var i = 0; i < this.currentMovies.length; i++) {
            this.$dataRow.append(`
                <div class="col-md-3">
                    <div class="movies-data-movie" onclick=moviesComponent.onMovieClick(${i})>
                        <div class="movies-data-movie-imgCont">
                            <img src="https://image.tmdb.org/t/p/w500/${this.currentMovies[i].poster_path}" alt="" srcset="">
                        </div>
                        <div class="movies-data-movie-body">
                            <h4 class="movies-data-movie-body-title">
                                ${this.currentMovies[i].title}
                            </h4>
                                <span class="movies-data-movie-body-rating">${this.currentMovies[i].vote_average}</span>
                        </div>
                    </div>
                </div>
            `)
        }
    },

    onMovieClick: function (index) {
        console.log(this.currentMovies[index]);
        eventsMediator.emit("movie.select", this.currentMovies[index]);
    }
}

var movieModalComponent = {
    movie: {},
    $modal: null,
    $modalBody: null,
    $modalClose: null,

    init: function () {
        this.$modalBody = $("#movieModal .modal-body");
        this.$modal = $("#movieModal");
        this.$modalClose = $("#modal-close");
        eventsMediator.on("movie.select", this.render.bind(this));
        this.bindEvents();
    },

    bindEvents: function(){
        this.$modalClose.click(closeModal.bind(this));

        function closeModal(){
            console.log("hello");
            this.$modal.hide();
        }
    },

    render: function (movie) {
        this.movie = movie;
        this.$modalBody.html(`
            <div class="row align-items-center">
                <div class="col-md-5">
                    <div class="imgCont">
                        <img src="https://image.tmdb.org/t/p/w500/${movie.poster_path}" class="img-fluid">
                    </div>
                </div>
                <div class="col-md-7">
                    <h2 class="movie-title">${movie.title}</h2>
                    <h3 class="movie-rating">Rating: ${movie.vote_average}/10 (${movie.vote_count})</h3>
                    <p class="lead">${movie.overview}</p>
                </div>
            </div>
        `);
        this.$modal.show();
    }
}

var statsComponent = {
    currentPage: null,
    numberOfMovies: 20,
    topRatedMovieTitle: null,
    topRatedMovieRating: null,

    $stats: null,

    init: function () {
        eventsMediator.on("movies.loaded", this.render.bind(this));
        this.$stats = $(".stats");
    },

    bindStats: function (data) {
        this.currentPage = data.page;
        this.numberOfMovies = data.results.length;
        var topRating = 0,
            topTitle = "";
        for (var i = 0; i < data.results.length; i++) {
            var current = data.results[i]
            if (current.vote_average > topRating) {
                topRating = current.vote_average;
                topTitle = current.title;
            }
        }
        this.topRatedMovieRating = topRating;
        this.topRatedMovieTitle = topTitle;
    },

    render: function (data) {
        this.bindStats(data);
        this.$stats.html(`
            <h3 class="stats-header">
                    Stats
                </h3>
                <div class="stats-item">
                    Current Page : <span id="current-page-value">${this.currentPage}</span>
                </div>
                <div class="stats-item">
                    Number of movies : <span id="total-movies-value">${this.numberOfMovies}</span>
                </div>
                <div class="stats-item">
                    Top rated movie: <span id="top-rated-value">${this.topRatedMovieTitle}</span>
                </div>
                <div class="stats-item">
                    Rating : <span id="top-rating-value">${this.topRatedMovieRating}</span>
                </div>
        `)
    }
}

var paginationComponent = {
    $prevBtn: null,
    $nextBtn: null,
    $pagination: null,

    init: function () {
        this.$pagination = $(".movies-pagination");
        this.render();
        this.$prevBtn = $("#prev-btn");
        this.$nextBtn = $("#next-btn");
        this.bindEvents();
    },

    render: function () {
        this.$pagination.append(`<button type="button" class="btn btn-secondary" id="prev-btn">Prev</button>
                <button type="button" class="btn btn-primary" id="next-btn">Next</button>`);
    },

    bindEvents: function () {
        this.$prevBtn.on("click", function () {
            eventsMediator.emit("pagination.prev");
        });
        this.$nextBtn.on("click", function () {
            eventsMediator.emit("pagination.next");
        });
    }
}

$(document).ready(function () {
    moviesComponent.init();
    statsComponent.init();
    paginationComponent.init();
    movieModalComponent.init();
})