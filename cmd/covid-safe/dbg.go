package main

import (
	"log"
	"net/http"
)

// Usage: mux := chi.NewRouter().With(dbg)
func dbg(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		log.Printf("METHOD: %s", r.Method)
		log.Printf("HOST: %q", r.Host)
		log.Printf("PATH: %q", r.URL.String())
		log.Printf("HEADER: %#v", r.Header)
		h.ServeHTTP(w, r)
	})
}
