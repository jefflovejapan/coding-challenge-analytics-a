from flask import Flask, render_template, request
import decimal
import pandas as pd
import json

D = decimal.Decimal
PREC = D('0.01')


class DataStore(object):
    def __init__(self, colnames, table_url):
        raw = pd.read_table(table_url, names=colnames)
        frame = raw[raw['country code'].notnull()]
        frame = frame[['geonameid', 'name', 'asciiname', 'latitude',
                       'longitude', 'country code',
                       'population']].set_index('geonameid')
        frame['in target'] = False
        target = json.loads(open('static/data/target-list.json').read())
        for item in target:
            if item in frame.index:
                frame['in target'].ix[item] = True
        self.frame = frame.set_index(['country code']).sort_index()

    def get_counts(self, key=None, column=None):
        return_dict = self.frame.ix[key][column].value_counts().to_dict()
        return return_dict

    def get_name_list(self, key=None, column=None, matchval=None):
        match_frame = (self.frame.ix[key][self.frame.ix[key][column] ==
                       matchval])
        match_list = match_frame['name'].tolist()
        return sorted(match_list)

    @property
    def country_codes(self):
        return self.frame.index.unique().tolist()


def build_response_dict(country_code):
    if country_code in store.country_codes:
            value_counts = store.get_counts(key=country_code,
                                            column='in target')
            print value_counts.keys()
            total_over_15k = int(store.frame.ix[country_code]
                                 ['name'].count())
            num_cities_covered = int(value_counts[True] if True in value_counts
                                     else 0)
            percentage_covered = str(D(100 * (value_counts[True] /
                                       float(total_over_15k))).quantize(PREC)
                                     if True in value_counts else 0)
            cities_covered = (store.get_name_list(key=country_code,
                              column='in target', matchval=True)
                              if num_cities_covered else [])
            cities_not_covered = (store.get_name_list(key=country_code,
                                  column='in target', matchval=False))
    else:
        '''
        If the country code doesn't appear, we know the country has no cities
        with pop > 15k
        '''
        total_over_15k = 0
        cities_covered = 0
        num_cities_covered = 0
        percentage_covered = 0
        cities_covered = []
        cities_not_covered = []

    response_dict = {
        'country_code': country_code,
        'total_over_15k': total_over_15k,
        'num_cities_covered': num_cities_covered,
        'percentage_covered': percentage_covered,
        'cities_covered': cities_covered,
        'cities_not_covered': cities_not_covered
    }

    return response_dict


colnames = ['geonameid', 'name', 'asciiname', 'alternatenames', 'latitude',
            'longitude', 'feature class', 'feature code', 'country code',
            'cc2', 'admin1 code', 'admin2 code', 'admin3 code', 'admin4 code',
            'population', 'elevation', 'dem', 'timezone', 'modification date']

app = Flask(__name__)
store = DataStore(colnames=colnames, table_url='static/data/cities15000.txt')


@app.route('/')
@app.route('/index')
def home():
    print 'inside home'
    # return render_template('index.html')
    return render_template('example.html')


@app.route('/country-data', methods=['POST'])
def country():
    country_code = request.form['country_code']
    response_dict = build_response_dict(country_code)
    return json.dumps(response_dict)


def main():

    app.run(debug=True)

if __name__ == '__main__':
    main()
