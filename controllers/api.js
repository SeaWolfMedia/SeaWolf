exports.main = (req, res) => {
    res.render("pages/movies", {
        "navigationTab": "Home",
        "windowName":"Movies",
        "jsFile":"movies",
        "database": bc.getMovies()
    });
}