const YEAR = new Date().getFullYear();

/**
 * 회사 정보 / 사업자 정보 / SNS 링크.
 * 실제 사업자 정보는 배포 전 확정된 값으로 교체 필요.
 */
export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/40">
      <div className="container-px mx-auto max-w-6xl py-12">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <p className="text-lg font-bold">DesignFOBEE</p>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              26년간 공간을 디자인해온 공간 브랜딩 기업.
              <br />
              사람의 경험을 디자인합니다.
            </p>
          </div>

          <div className="text-sm text-muted-foreground space-y-1">
            <p>주식회사 디자인포비</p>
            <p>대표이사 이대성</p>
            <p>설립 2000.10.27</p>
            <p>이메일 ceo@fobee.co.kr</p>
          </div>

          <div className="text-sm text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">GBRICK Coffee</p>
            <p>공간과 커피를 결합한 브랜드</p>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-xs text-muted-foreground">
          © {YEAR} DesignFOBEE Inc. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
