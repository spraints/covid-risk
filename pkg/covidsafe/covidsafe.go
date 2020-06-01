package covidsafe

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi"
)

func New(dataDir string) (*CovidSafe, error) {
	usStates, err := readUSStates(dataDir)
	if err != nil {
		return nil, err
	}

	usCounties, err := readUSCounties(dataDir)
	if err != nil {
		return nil, err
	}

	global, err := readGlobal(dataDir)
	if err != nil {
		return nil, err
	}

	return &CovidSafe{
		usStates:   usStates,
		usCounties: usCounties,
		global:     global,
	}, nil
}

type CovidSafe struct {
	usStates   usStates
	usCounties usCounties
	global     globalCSV
}

func (c *CovidSafe) Register(router chi.Router) {
	router.Get("/places/summary", c.summary)
	router.Get("/places/details", c.details)
}

type summary struct {
	Countries []country `json:"countries"`
}

type country struct {
	Name      string     `json:"name"`
	Provinces []province `json:"provinces"`
}

type province struct {
	Name     string   `json:"name"`
	Counties []county `json:"counties,omitempty"`
}

type county struct {
	Name string `json:"name"`
}

func (cs *CovidSafe) summary(w http.ResponseWriter, r *http.Request) {
	var (
		s summary
		c *country
	)

	for _, row := range cs.global {
		pName := row[0]
		cName := row[1]
		if cName == "US" {
			continue
		}
		if c != nil && c.Name != cName {
			s.Countries = append(s.Countries, *c)
			c = nil
		}
		if len(pName) == 0 {
			s.Countries = append(s.Countries, country{Name: cName})
			continue
		}
		if c == nil {
			c = &country{Name: cName}
		}
		c.Provinces = append(c.Provinces, province{Name: pName})
	}
	if c != nil {
		s.Countries = append(s.Countries, *c)
	}

	states := map[string]map[string]struct{}{}
	for _, row := range cs.usCounties {
		cName := row[1]
		sName := row[2]
		if _, ok := states[sName]; !ok {
			states[sName] = map[string]struct{}{}
		}
		states[sName][cName] = struct{}{}
	}
	var us country
	us.Name = "US"
	for sName, counties := range states {
		var p province
		p.Name = sName
		for cty, _ := range counties {
			p.Counties = append(p.Counties, county{Name: cty})
		}
		us.Provinces = append(us.Provinces, p)
	}
	s.Countries = append(s.Countries, us)

	json.NewEncoder(w).Encode(&s)
}

func (c *CovidSafe) details(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte("TODO: for a given place: last 7 days case numbers, population"))
}
