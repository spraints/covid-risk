package covidsafe

import (
	"encoding/json"
	"net/http"
	"strconv"

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
	router.Get("/places/details/{country}", c.getDetails)
	router.Get("/places/details/{country}/{province}", c.getDetails)
	router.Get("/places/details/{country}/{province}/{county}", c.getDetails)
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
	// TODO memoize all this

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

type details struct {
	Country    string `json:"country"`
	Province   string `json:"province"`
	County     string `json:"county"`
	Last7      int    `json:"last7"`
	Population int    `json:"population"`
}

const TBD = -1

func (c *CovidSafe) getDetails(w http.ResponseWriter, r *http.Request) {
	var d details
	d.Country = chi.URLParam(r, "country")
	d.Province = chi.URLParam(r, "province")
	d.County = chi.URLParam(r, "county")

	if d.Country == "US" {
		if d.County != "" {
			c.fillUSCountyDetails(&d)
		} else if d.Province != "" {
			c.fillUSStateDetails(&d)
		} else {
			c.fillUSDetails(&d)
		}
	} else {
		if d.Province != "" {
			c.fillProvinceDetails(&d)
		} else {
			c.fillCountryDetails(&d)
		}
	}

	json.NewEncoder(w).Encode(&d)
}

func (c *CovidSafe) fillUSCountyDetails(d *details) {
	var points []int
	for _, row := range c.usCounties {
		if row[1] == d.County && row[2] == d.Province {
			points = append(points, atoi(row[4]))
		}
	}
	d.Last7 = points[len(points)-1] - points[len(points)-8]
	d.Population = TBD
}

func (c *CovidSafe) fillUSStateDetails(d *details) {
	var points []int
	for _, row := range c.usStates {
		if row[1] == d.Province {
			points = append(points, atoi(row[3]))
		}
	}
	d.Last7 = points[len(points)-1] - points[len(points)-8]
	d.Population = TBD
}

func (c *CovidSafe) fillUSDetails(d *details) {
	var (
		points []int
		date   string
		point  int
	)
	for _, row := range c.usStates {
		if date != row[0] {
			points = append(points, point)
			date = row[0]
			point = 0
		}
		point += atoi(row[3])
	}
	d.Last7 = point - points[len(points)-7]
	d.Population = TBD
}

func (c *CovidSafe) fillProvinceDetails(d *details) {
	for _, row := range c.global {
		if d.Province == row[0] && d.Country == row[1] {
			d.Last7 = atoi(row[len(row)-1]) - atoi(row[len(row)-8])
			d.Population = TBD
			return
		}
	}
}

func (c *CovidSafe) fillCountryDetails(d *details) {
	last7 := 0
	for _, row := range c.global {
		if d.Country == row[1] {
			last7 += atoi(row[len(row)-1]) - atoi(row[len(row)-8])
		}
	}
	d.Last7 = last7
	d.Population = TBD
}

func atoi(s string) int {
	i, err := strconv.Atoi(s)
	if err != nil {
		panic(err)
	}
	return i
}
