// -- copyright
// OpenProject is a project management system.
// Copyright (C) 2012-2015 the OpenProject Foundation (OPF)
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License version 3.
//
// OpenProject is a fork of ChiliProject, which is a fork of Redmine. The copyright follows:
// Copyright (C) 2006-2013 Jean-Philippe Lang
// Copyright (C) 2010-2013 the ChiliProject Team
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License
// as published by the Free Software Foundation; either version 2
// of the License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program; if not, write to the Free Software
// Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
//
// See doc/COPYRIGHT.rdoc for more details.
// ++

import {States} from 'core-components/states.service';
import {combine} from 'reactivestates';
import {Observable} from 'rxjs/Observable';
import {mapTo} from 'rxjs/operators';
import {opServicesModule} from '../../../angular-modules';
import {QueryResource} from '../../api/api-v3/hal-resources/query-resource.service';
import {
  QUERY_SORT_BY_ASC,
  QUERY_SORT_BY_DESC,
  QuerySortByResource
} from '../../api/api-v3/hal-resources/query-sort-by-resource.service';
import {QueryColumn} from '../../wp-query/query-column';
import {WorkPackageTableSortBy} from '../wp-table-sort-by';
import {WorkPackageQueryStateService, WorkPackageTableBaseService} from './wp-table-base.service';

export class WorkPackageTableSortByService extends WorkPackageTableBaseService<WorkPackageTableSortBy> implements WorkPackageQueryStateService {

  public constructor(states:States) {
    super(states);
  }


  public get state() {
    return this.tableState.sortBy;
  }

  public valueFromQuery(query:QueryResource) {
    return new WorkPackageTableSortBy(query);
  }

  public onReadyWithAvailable():Observable<null> {
    return combine(this.state, this.states.query.available.sortBy)
      .values$()
      .pipe(
        mapTo(null)
      );
  }

  public hasChanged(query:QueryResource) {
    const comparer = (sortBy:QuerySortByResource[]) => sortBy.map(el => el.href);

    return !_.isEqual(
      comparer(query.sortBy),
      comparer(this.current.current)
    );
  }

  public applyToQuery(query:QueryResource) {
    query.sortBy = _.cloneDeep(this.current.current);
    return true;
  }

  public isSortable(column:QueryColumn):boolean {
    return !!_.find(
      this.available,
      (candidate) => candidate.column.$href === column.$href
    );
  }

  public addAscending(column:QueryColumn) {
    let available = this.findAvailableDirection(column, QUERY_SORT_BY_ASC);

    if (available) {
      this.add(available);
    }
  }

  public addDescending(column:QueryColumn) {
    let available = this.findAvailableDirection(column, QUERY_SORT_BY_DESC);

    if (available) {
      this.add(available);
    }
  }

  public findAvailableDirection(column:QueryColumn, direction:string):QuerySortByResource | undefined {
    return _.find(
      this.available,
      (candidate) => (candidate.column.$href === column.$href &&
        candidate.direction.$href === direction)
    );
  }

  public add(sortBy:QuerySortByResource) {
    let currentState = this.current;

    currentState.addCurrent(sortBy);

    this.state.putValue(currentState);
  }

  public set(sortBys:QuerySortByResource[]) {
    let currentState = this.current;

    currentState.setCurrent(sortBys);

    this.state.putValue(currentState);
  }

  private get current():WorkPackageTableSortBy {
    return this.state.value as WorkPackageTableSortBy;
  }

  private get availableState() {
    return this.states.query.available.sortBy;
  }

  public get currentSortBys():QuerySortByResource[] {
    return this.current.current;
  }

  public get available():QuerySortByResource[] {
    return this.availableState.getValueOr([]);
  }
}

opServicesModule.service('wpTableSortBy', WorkPackageTableSortByService);
