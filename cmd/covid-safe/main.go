package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"sync"
	"syscall"
	"time"

	"github.com/go-chi/chi"
	"github.com/kelseyhightower/envconfig"

	"github.com/spraints/covid-safe/pkg/covidsafe"
)

type Config struct {
	ListenAddr string `split_words:"true" default:"127.0.0.1:8080"`

	PublicPath      string `split_words:"true" default:"public"`
	TemplatesPath   string `split_words:"true" default:"templates"`
	ReloadTemplates bool   `split_words:"true" default:"false"`

	DataPath string `split_words:"true" default:"data"`
}

func main() {
	var cfg Config

	if err := envconfig.Process("", &cfg); err != nil {
		log.Fatal(err)
	}

	stopSignal := make(chan os.Signal, 1)
	signal.Notify(stopSignal, syscall.SIGINT, syscall.SIGTERM)

	svc, err := covidsafe.New(cfg.DataPath)
	if err != nil {
		log.Fatal(err)
	}

	var shutdown sync.WaitGroup
	ctx, cancel := context.WithCancel(context.Background())
	//run(ctx, &shutdown, "poll current temperature", svc.Poll)
	run(ctx, &shutdown, "http server on "+cfg.ListenAddr, newHTTPServer(&cfg, svc))
	<-stopSignal
	cancel()
	wait(10*time.Second, &shutdown)
}

func run(ctx context.Context, wg *sync.WaitGroup, label string, runFn func(context.Context)) {
	log.Printf("%s: starting", label)
	wg.Add(1)
	go func() {
		defer wg.Done()
		runFn(ctx)
		log.Printf("%s: finished", label)
	}()
}

func wait(timeout time.Duration, wg *sync.WaitGroup) {
	done := make(chan struct{})
	go func() {
		defer close(done)
		wg.Wait()
	}()
	select {
	case <-done:
		return
	case <-time.After(timeout):
		log.Print("shut down before all threads finished")
	}
}

type service interface {
	Register(mux chi.Router)
}

func newHTTPServer(cfg *Config, services ...service) func(context.Context) {
	mux := chi.NewRouter()

	for _, svc := range services {
		svc.Register(mux)
	}
	mux.Mount("/", http.FileServer(http.Dir(cfg.PublicPath)))

	server := http.Server{
		Addr:    cfg.ListenAddr,
		Handler: logRequests(mux),
	}

	return func(ctx context.Context) {
		go func() {
			if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
				log.Fatal(err)
			}
		}()
		<-ctx.Done()
		if err := server.Shutdown(context.Background()); err != nil {
			log.Printf("failed to shut down HTTP server cleanly: %v", err)
		}

	}
}

func logRequests(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		log.Printf("method=%s host=%s path=%s content_length=%d", r.Method, r.Host, r.URL.String(), r.ContentLength)
		next.ServeHTTP(w, r)
	})
}
