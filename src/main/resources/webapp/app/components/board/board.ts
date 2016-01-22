import {Component, View} from 'angular2/core';
import {Router, RouteParams} from 'angular2/router';
import {IssuesService} from '../../services/issuesService';
import {clearToken,setToken} from '../../services/authenticationHelper';
import {BoardData} from '../../data/board/boardData';
import {IssueData} from '../../data/board/issueData';
import {IssueComponent} from './issue/issue';
import {SwimlaneEntryComponent} from './swimlaneEntry/swimlaneEntry';
import {PanelMenuComponent} from "./panelMenu/panelMenu";
import {IssueContextMenuComponent, IssueContextMenuData} from "./issueContextMenu/issueContextMenu";
import {OnDestroy} from "angular2/core";

@Component({
    selector: 'board',
    providers: [IssuesService, BoardData]
})
@View({
    templateUrl: 'app/components/board/board.html',
    styleUrls: ['app/components/board/board.css'],
    directives: [IssueComponent, IssueContextMenuComponent, PanelMenuComponent, SwimlaneEntryComponent]
})
export class BoardComponent implements OnDestroy {
    boardId:number;

    private owner:string;

    private boardHeight; //board + headers
    private boardBodyHeight; //board + headers
    private width;

    private issueContextMenuData:IssueContextMenuData;

    constructor(private issuesService:IssuesService, private router:Router, private routeParams:RouteParams, private boardData:BoardData) {
        let boardId:string = routeParams.get('board');
        if (boardId) {
            this.boardId = Number(boardId);
        }

        issuesService.getIssuesData(this.boardId).subscribe(
            data => {
                this.setIssueData(data);
            },
            err => {
                console.log(err);
                //TODO logout locally if 401, and redirect to login
                //err seems to contain a complaint about the json marshalling of the empty body having gone wrong,
                //rather than about the auth problems

                //To be safe, go back to the login page
                clearToken();
                this.router.navigateByUrl('/login');
            },
            () => console.log('Board: data loaded')
        );
        this.setWindowSize();
    }

    ngOnDestroy():any {
        //this.issuesService.closeWebSocket();
        return null;
    }

    private setIssueData(issueData:any) {
        this.boardData.deserialize(this.boardId, issueData);

        //this.issuesService.registerWebSocket(this.boardName, (data : any) => {
        //    let command:string = data.command;
        //    if (command === "full-refresh") {
        //        let payload:any = data["payload"];
        //        this.boardData.messageFullRefresh(payload);
        //        console.log("Got new data!")
        //    } else if (command === "issue-move") {
        //        let payload:any = data["payload"];
        //        this.boardData.messageIssueMove(payload);
        //        console.log("Got new data!")
        //    }
        //});
    }

    private get visibleColumns() {
        return this.boardData.visibleColumns;
    }


    private toggleColumn(stateIndex:number) {
        this.boardData.toggleColumnVisibility(stateIndex);
    }

    private toCharArray(state:string):string[] {
        let arr:string[] = [];
        for (let i:number = 0; i < state.length; i++) {
            let s = state.charAt(i);
            if (s == " ") {
            }
            arr.push(s);
        }
        return arr;
    }

    private get boardStates():string[] {
        return this.boardData.boardStates;
    }

    private onResize(event : any) {
        this.setWindowSize();
    }

    private setWindowSize() {
        //Whole height - toolbars - borders
        this.boardHeight = window.innerHeight - 30 - 4;
        //board height - header - borders
        this.boardBodyHeight = this.boardHeight - 30 - 3;
        this.width = window.innerWidth - 2; //subtract width of border
    }

    private showIssueContextMenu(event:any) {
        this.issueContextMenuData = new IssueContextMenuData(event.issueId, event.x, event.y);
    }

    private hideMenus() {
        this.boardData.hideHideables();
        this.issueContextMenuData = null;
    }

    onCloseIssueContextMenu(event:any) {
        this.issueContextMenuData = null;
    }
}